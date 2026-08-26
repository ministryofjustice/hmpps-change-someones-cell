import config from '../../config'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'
import { putLastNameFirst, formatLocation, formatName } from '../../utils'

type Params = {
  locationService: LocationService
  prisonerCellAllocationService: PrisonerCellAllocationService
}

export default ({ locationService, prisonerCellAllocationService }: Params) =>
  async (req, res) => {
    const residentialLocationPrefix = async (systemClientToken: string, locationKey, userCaseLoad) => {
      const fullLocationPrefix = await locationService.getAgencyGroupLocationPrefix(
        systemClientToken,
        userCaseLoad,
        locationKey,
      )
      if (fullLocationPrefix) {
        const locationIdWithSuffix = fullLocationPrefix.locationPrefix
        return locationIdWithSuffix?.length < 1 ? '' : locationIdWithSuffix.slice(0, -1)
      }
      return `${userCaseLoad}-${locationKey}`
    }

    const {
      systemClientToken,
      user: { activeCaseLoad },
    } = res.locals
    const { location } = req.query

    const currentUserCaseLoad = activeCaseLoad && activeCaseLoad.caseLoadId

    const locationsData = await locationService.searchGroups(systemClientToken, currentUserCaseLoad)
    const locationOptions = [
      { text: 'Select', value: 'SELECT' },
      ...locationsData.map(locationData => ({ text: locationData.name, value: locationData.key })),
    ]

    const hasSearched = location !== undefined
    if (!hasSearched) {
      return res.render('cellMove/cellMoveViewResidentialLocation.njk', {
        showResults: false,
        locationOptions,
      })
    }

    const noLocationSelected = location === 'SELECT'
    if (noLocationSelected) {
      const noLocationSelectedError = {
        href: '#location',
        text: 'Select a residential location',
      }
      return res.render('cellMove/cellMoveViewResidentialLocation.njk', {
        showResults: false,
        locationOptions,
        errors: [noLocationSelectedError],
      })
    }

    const locationPrefix = await residentialLocationPrefix(systemClientToken, location, currentUserCaseLoad)

    // One call now: prisoner-search matches every cell beneath the location prefix and returns the
    // alerts and category prison-api did not, so the second lookup that topped them up has gone
    // (MAPA-318).
    const prisoners = await prisonerCellAllocationService.searchInmates(systemClientToken, currentUserCaseLoad, {
      cellLocationPrefix: locationPrefix,
    })

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
        profileUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.prisonerNumber}`,
      }
    })

    return res.render('cellMove/cellMoveViewResidentialLocation.njk', {
      showResults: true,
      formValues: { ...req.query },
      locationOptions,
      results,
      totalOffenders: results.length,
    })
  }
