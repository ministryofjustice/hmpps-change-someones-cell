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
    const prisonApiLocationDescription = async (systemClientToken: string, locationKey, userCaseLoad) => {
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

    const locationDesc = await prisonApiLocationDescription(systemClientToken, location, currentUserCaseLoad)

    const prisoners = await prisonerCellAllocationService.getInmates(systemClientToken, locationDesc, null, true)

    const results = prisoners?.map(prisoner => ({
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
      cellSearchUrl: `/prisoner/${prisoner.offenderNo}/cell-move/search-for-cell?returnToService=default`,
      profileUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.offenderNo}`,
    }))

    return res.render('cellMove/cellMoveViewResidentialLocation.njk', {
      showResults: true,
      formValues: { ...req.query },
      locationOptions,
      results,
      totalOffenders: results.length,
    })
  }
