import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'
import { putLastNameFirst, formatLocation, formatName } from '../../utils'
import config from '../../config'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

type Params = {
  prisonerCellAllocationService: PrisonerCellAllocationService
}

export default ({ prisonerCellAllocationService }: Params) =>
  async (req, res) => {
    const {
      user: { activeCaseLoad },
    } = res.locals
    const { keywords } = req.query

    if (!keywords) {
      const hasSearched = keywords !== undefined
      const emptySearchError = {
        href: '#keywords',
        text: 'Enter a prisoner’s name or number',
      }
      return res.render('cellMove/cellMovePrisonerSearch.njk', {
        showResults: false,
        errors: hasSearched ? [emptySearchError] : [],
      })
    }

    const currentUserCaseLoad = activeCaseLoad && activeCaseLoad.caseLoadId

    const prisoners = await prisonerCellAllocationService.getInmates(
      res.locals.systemClientToken,
      currentUserCaseLoad,
      keywords,
      true,
    )

    const results =
      prisoners &&
      prisoners.map(prisoner => ({
        ...prisoner,
        assignedLivingUnitDesc: formatLocation(prisoner.assignedLivingUnitDesc),
        name: putLastNameFirst(prisoner.firstName, prisoner.lastName),
        formattedName: formatName(prisoner.firstName, prisoner.lastName),
        alerts: alertFlagLabels.filter(alertFlag =>
          alertFlag.alertCodes.some(
            alert => prisoner.alertsDetails?.includes(alert) && cellMoveAlertCodes.includes(alert),
          ),
        ),
        cellHistoryUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.offenderNo}/location-details`,
        cellSearchUrl: `/prisoner/${prisoner.offenderNo}/cell-move/search-for-cell?returnUrl=/`,
      }))

    return res.render('cellMove/cellMovePrisonerSearch.njk', {
      showResults: true,
      formValues: { ...req.query },
      results,
      totalOffenders: results.length,
    })
  }
