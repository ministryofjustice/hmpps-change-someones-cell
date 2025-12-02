import { alertFlagLabels } from '../../shared/alertFlagValues'
import { putLastNameFirst, formatLocation, formatName } from '../../utils'
import config from '../../config'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'

type Params = {
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerCellAllocationService, prisonerDetailsService }: Params) =>
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

    const prisonersAlerts = await prisonerDetailsService.getPrisoners(
      res.locals.systemClientToken,
      prisoners.map(p => p.offenderNo),
    )

    const prisonersWithEnhancedAlertData = prisoners.map(prisoner => {
      const offender = prisonersAlerts.find(p => p.prisonerNumber === prisoner.offenderNo)
      return {
        ...prisoner,
        alerts: offender?.alerts || [],
        categoryCode: offender?.category || '',
      }
    })

    const results =
      prisonersWithEnhancedAlertData &&
      prisonersWithEnhancedAlertData.map(prisoner => ({
        ...prisoner,
        assignedLivingUnitDesc: formatLocation(prisoner.assignedLivingUnitDesc),
        name: putLastNameFirst(prisoner.firstName, prisoner.lastName),
        formattedName: formatName(prisoner.firstName, prisoner.lastName),
        alerts: alertFlagLabels.filter(alertFlag =>
          alertFlag.alertCodes.some(alert => {
            const alertsDetails = prisoner.alerts.map((a: { alertCode: string }) => a.alertCode)
            return alertsDetails && alertsDetails.includes(alert)
          }),
        ),
        cellHistoryUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.offenderNo}/location-details`,
        cellSearchUrl: `/prisoner/${prisoner.offenderNo}/cell-move/search-for-cell?returnToService=default`,
      }))

    return res.render('cellMove/cellMovePrisonerSearch.njk', {
      showResults: true,
      formValues: { ...req.query },
      results,
      totalOffenders: results.length,
    })
  }
