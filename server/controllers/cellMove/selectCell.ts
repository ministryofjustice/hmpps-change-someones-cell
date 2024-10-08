import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'

import { putLastNameFirst, hasLength, properCaseName, formatName, formatLocation } from '../../utils'

import {
  userHasAccess,
  getNonAssociationsInEstablishment,
  renderLocationOptions,
  cellAttributes,
} from './cellMoveUtils'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import LocationService from '../../services/locationService'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'
import config from '../../config'
import { Prisoner } from '../../data/prisonerSearchApiClient'
import { getActualCapacity } from '../../data/locationsInsidePrisonApiClient'

const defaultSubLocationsValue = { text: 'Select area in residential unit', value: '' }
const noAreasSelectedDropDownValue = { text: 'No areas to select', value: '' }
const toDropDownValue = entry => ({ text: entry.name, value: entry.key })

const getCellOccupants = ({
  prisonersInCell,
  nonAssociations,
}: {
  prisonersInCell: Prisoner[]
  nonAssociations: PrisonerNonAssociation
}) => {
  if (!hasLength(prisonersInCell)) return []

  return prisonersInCell.map(occupant => {
    const alertCodes = occupant.alerts
      .filter(alert => !alert.expired && cellMoveAlertCodes.includes(alert.alertCode))
      .map(alert => alert.alertCode)

    return {
      cellId: occupant.cellLocation,
      name: `${properCaseName(occupant.lastName)}, ${properCaseName(occupant.firstName)}`,
      viewOffenderDetails: `/prisoner/${occupant.prisonerNumber}/cell-move/prisoner-details`,
      alerts: alertFlagLabels.filter(label => label.alertCodes.some(code => alertCodes.includes(code))),
      nonAssociation: Boolean(
        nonAssociations &&
          nonAssociations.nonAssociations &&
          nonAssociations.nonAssociations.find(
            na => na.otherPrisonerDetails.prisonerNumber === occupant.prisonerNumber,
          ),
      ),
      csra: occupant.csra || 'Not entered',
      csraDetailsUrl: `/prisoner/${occupant.prisonerNumber}/cell-move/cell-sharing-risk-assessment-details`,
    }
  })
}

const getResidentialLevelNonAssociations = async ({
  nonAssociations,
  cellId,
  location,
}: {
  nonAssociations: PrisonerNonAssociation
  cellId: string
  location: string
}) => {
  if (!nonAssociations || !cellId) return []

  if (!location || location === 'ALL') {
    return nonAssociations.nonAssociations
  }

  const [locationPrefix] = cellId.split('-')

  return nonAssociations.nonAssociations.filter(
    nonAssociation =>
      nonAssociation.otherPrisonerDetails.cellLocation &&
      nonAssociation.otherPrisonerDetails.cellLocation.startsWith(locationPrefix),
  )
}

type Params = {
  locationService: LocationService
  nonAssociationsService: NonAssociationsService
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({
    locationService,
    nonAssociationsService,
    prisonerCellAllocationService,
    prisonerDetailsService,
  }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { location = 'ALL', subLocation, cellType, locationId } = req.query

    const { systemClientToken, user } = res.locals
    const { userRoles, allCaseloads: userCaseLoads } = user

    try {
      const prisonerDetails = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)

      if (!userHasAccess({ userRoles, userCaseLoads, offenderCaseload: prisonerDetails.prisonId })) {
        return res.render('notFound.njk', { url: '/prisoner-search' })
      }

      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)
      const locationsData = await locationService.searchGroups(systemClientToken, prisonerDetails.prisonId)

      if (req.xhr) {
        return res.render('cellMove/partials/subLocationsSelect.njk', {
          subLocations:
            locationId === 'ALL'
              ? [noAreasSelectedDropDownValue]
              : [
                  defaultSubLocationsValue,
                  ...locationsData
                    .find(loc => loc.key.toLowerCase() === locationId.toLowerCase())
                    .children.map(toDropDownValue),
                ],
        })
      }

      const subLocations =
        location === 'ALL'
          ? [noAreasSelectedDropDownValue]
          : [
              defaultSubLocationsValue,
              ...(
                locationsData.find(loc => loc.key.toLowerCase() === location.toLowerCase()) || { children: [] }
              ).children.map(toDropDownValue),
            ]

      const prisonersActiveAlertCodes = prisonerDetails.alerts
        .filter(alert => !alert.expired)
        .map(alert => alert.alertCode)

      const alertsToShow = alertFlagLabels.filter(alertFlag =>
        alertFlag.alertCodes.some(
          alert => prisonersActiveAlertCodes.includes(alert) && cellMoveAlertCodes.includes(alert),
        ),
      )

      // If the location is 'ALL' we do not need to call the whereabouts API,
      // we can directly call prisonApi.
      const cells = await prisonerCellAllocationService.getCellsWithCapacity(
        systemClientToken,
        prisonerDetails.prisonId,
        location,
        subLocation,
      )

      const residentialLevelNonAssociations = await getResidentialLevelNonAssociations({
        nonAssociations,
        cellId: hasLength(cells) && cells[0].pathHierarchy,
        location,
      })

      const selectedCells = cells.filter(cell => {
        const actualCapacity = getActualCapacity(cell)
        if (cellType === 'SO') return actualCapacity === 1
        if (cellType === 'MO') return actualCapacity > 1
        return cell
      })

      const numberOfNonAssociations = getNonAssociationsInEstablishment(nonAssociations).length

      const prisonerDetailsWithFormattedLocation = {
        ...prisonerDetails,
        assignedLivingUnit: {
          description: formatLocation(prisonerDetails?.cellLocation),
        },
      }

      const useSpecialistCellTypes = await locationService.getActiveAgenciesInLocationService(
        systemClientToken,
        prisonerDetails.prisonId,
      )
      return res.render('cellMove/selectCell.njk', {
        formValues: {
          location,
          subLocation,
          cellType,
        },
        breadcrumbPrisonerName: putLastNameFirst(prisonerDetails.firstName, prisonerDetails.lastName),
        prisonerName: formatName(prisonerDetails.firstName, prisonerDetails.lastName),
        numberOfNonAssociations,
        showNonAssociationsLink: numberOfNonAssociations > 0,
        alerts: alertsToShow,
        showNonAssociationWarning: Boolean(residentialLevelNonAssociations.length),
        cells: selectedCells
          ?.filter(cell => cell.pathHierarchy !== prisonerDetails.cellLocation)
          .map(cell => {
            const actualCapacity = getActualCapacity(cell)
            const cellTypes = useSpecialistCellTypes ? cell.specialistCellTypes : cell.legacyAttributes
            return {
              key: cell.key,
              type: hasLength(cellTypes) && cellTypes.sort(),
              actualCapacity,
              spaces: actualCapacity - cell.noOfOccupants,
              occupants: getCellOccupants({ prisonersInCell: cell.prisonersInCell, nonAssociations }),
            }
          }),
        locations: renderLocationOptions(locationsData),
        subLocations,
        cellAttributes,
        prisonerDetails: prisonerDetailsWithFormattedLocation,
        offenderNo,
        nonAssociationLink: `/prisoner/${offenderNo}/cell-move/non-associations`,
        offenderDetailsUrl: `/prisoner/${offenderNo}/cell-move/prisoner-details`,
        csraDetailsUrl: `/prisoner/${offenderNo}/cell-move/cell-sharing-risk-assessment-details`,
        searchForCellRootUrl: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        selectCellRootUrl: `/prisoner/${offenderNo}/cell-move/select-cell`,
        formAction: `/prisoner/${offenderNo}/cell-move/select-cell`,
        convertedCsra: prisonerDetails.csra,
        backUrl: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
