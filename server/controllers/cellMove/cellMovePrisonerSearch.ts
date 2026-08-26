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

    // One call now: prisoner-search returns the alerts and category that prison-api did not, so the
    // second lookup this screen used to make to top them up has gone (MAPA-318).
    const prisoners = await prisonerCellAllocationService.searchInmates(
      res.locals.systemClientToken,
      currentUserCaseLoad,
      { term: keywords as string },
    )

    const results = prisoners.map(prisoner => {
      const alertCodes = prisoner.alerts?.map(alert => alert.alertCode) || []
      return {
        offenderNo: prisoner.prisonerNumber,
        assignedLivingUnitDesc: formatLocation(prisoner.cellLocation),
        name: putLastNameFirst(prisoner.firstName, prisoner.lastName),
        formattedName: formatName(prisoner.firstName, prisoner.lastName),
        categoryCode: prisoner.category || '',
        alerts: alertFlagLabels.filter(alertFlag =>
          alertFlag.alertCodes.some(alert => alertCodes.includes(alert) && cellMoveAlertCodes.includes(alert)),
        ),
        cellHistoryUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.prisonerNumber}/location-details`,
        cellSearchUrl: `/prisoner/${prisoner.prisonerNumber}/cell-move/search-for-cell?returnToService=default`,
      }
    })

    return res.render('cellMove/cellMovePrisonerSearch.njk', {
      showResults: true,
      formValues: { ...req.query },
      results,
      totalOffenders: results.length,
    })
  }
