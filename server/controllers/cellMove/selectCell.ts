import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'

import { putLastNameFirst, hasLength, properCaseName, formatName, formatLocation, stripAgencyPrefix } from '../../utils'

import {
  userHasAccess,
  getNonAssociationsInEstablishment,
  renderLocationOptions,
  cellAttributes,
  translateCsra,
} from './cellMoveUtils'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import LocationService from '../../services/locationService'
import { OffenderNonAssociationLegacy } from '../../data/nonAssociationsApiClient'
import config from '../../config'
import { OffenderCell } from '../../data/prisonApiClient'

const defaultSubLocationsValue = { text: 'Select area in residential unit', value: '' }
const noAreasSelectedDropDownValue = { text: 'No areas to select', value: '' }
const toDropDownValue = entry => ({ text: entry.name, value: entry.key })

const sortByDescription = (a, b) => a.description.localeCompare(b.description)

const getCellOccupants = async (
  req,
  res,
  {
    prisonerCellAllocationService,
    activeCaseLoadId,
    cells,
    nonAssociations,
  }: {
    prisonerCellAllocationService: PrisonerCellAllocationService
    activeCaseLoadId: string
    cells: OffenderCell[]
    nonAssociations: OffenderNonAssociationLegacy
  },
) => {
  const cellDescriptions = cells.map(cell => stripAgencyPrefix(cell.description, activeCaseLoadId))

  let currentCellOccupants = []

  if (cellDescriptions.length)
    currentCellOccupants = await prisonerCellAllocationService.getPrisonersAtLocations(
      res.locals.systemClientToken,
      activeCaseLoadId,
      cellDescriptions,
    )

  if (!hasLength(currentCellOccupants)) return []

  return cells.flatMap(cell => {
    const occupants = currentCellOccupants.filter(
      o => o.cellLocation === stripAgencyPrefix(cell.description, activeCaseLoadId),
    )
    return occupants.map(occupant => {
      const csraInfo = occupant.csra

      const alertCodes = occupant.alerts
        .filter(alert => !alert.expired && cellMoveAlertCodes.includes(alert.alertCode))
        .map(alert => alert.alertCode)

      return {
        cellId: cell.id,
        name: `${properCaseName(occupant.lastName)}, ${properCaseName(occupant.firstName)}`,
        viewOffenderDetails: `/prisoner/${occupant.prisonerNumber}/cell-move/prisoner-details`,
        alerts: alertFlagLabels.filter(label => label.alertCodes.some(code => alertCodes.includes(code))),
        nonAssociation: Boolean(
          nonAssociations &&
            nonAssociations.nonAssociations &&
            nonAssociations.nonAssociations.find(
              na => na.offenderNonAssociation.offenderNo === occupant.prisonerNumber,
            ),
        ),
        csra: csraInfo || 'Not entered',
        csraDetailsUrl: `/prisoner/${occupant.prisonerNumber}/cell-move/cell-sharing-risk-assessment-details`,
      }
    })
  })
}

const getResidentialLevelNonAssociations = async (
  res,
  {
    locationService,
    nonAssociations,
    cellId,
    agencyId,
    location,
  }: {
    locationService: LocationService
    nonAssociations: OffenderNonAssociationLegacy
    cellId: number
    agencyId: string
    location: string
  },
) => {
  if (!nonAssociations || !cellId) return []

  if (!location || location === 'ALL') {
    return nonAssociations.nonAssociations.filter(
      nonAssociation =>
        nonAssociation.offenderNonAssociation.assignedLivingUnitDescription &&
        nonAssociation.offenderNonAssociation.assignedLivingUnitDescription.includes(agencyId),
    )
  }
  // Get the residential unit level prefix for the selected cell by traversing up the
  // parent location tree
  const locationDetail = await locationService.getLocation(res.locals.systemClientToken, cellId)
  const parentLocationDetail = await locationService.getLocation(
    res.locals.systemClientToken,
    locationDetail.parentLocationId,
  )
  const { locationPrefix } = await locationService.getLocation(
    res.locals.systemClientToken,
    parentLocationDetail.parentLocationId,
  )

  return nonAssociations.nonAssociations.filter(
    nonAssociation =>
      nonAssociation.offenderNonAssociation.assignedLivingUnitDescription &&
      nonAssociation.offenderNonAssociation.assignedLivingUnitDescription.includes(locationPrefix),
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
    const { userRoles, allCaseloads: userCaseLoads, activeCaseLoad } = user
    const { caseLoadId: activeCaseLoadId } = activeCaseLoad

    try {
      const prisonerDetails = await prisonerDetailsService.getDetails(systemClientToken, offenderNo, true)

      if (!userHasAccess({ userRoles, userCaseLoads, offenderCaseload: prisonerDetails.agencyId })) {
        return res.render('notFound.njk', { url: '/prisoner-search' })
      }

      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)
      const locationsData = await locationService.searchGroups(systemClientToken, prisonerDetails.agencyId)

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
        prisonerDetails.agencyId,
        location,
        subLocation,
      )

      const residentialLevelNonAssociations = await getResidentialLevelNonAssociations(res, {
        locationService,
        nonAssociations,
        cellId: hasLength(cells) && cells[0].id,
        agencyId: prisonerDetails.agencyId,
        location,
      })

      const selectedCells = cells.filter(cell => {
        if (cellType === 'SO') return cell.capacity === 1
        if (cellType === 'MO') return cell.capacity > 1
        return cell
      })

      const cellOccupants = await getCellOccupants(req, res, {
        prisonerCellAllocationService,
        activeCaseLoadId,
        cells: selectedCells,
        nonAssociations,
      })

      const numberOfNonAssociations = (
        await getNonAssociationsInEstablishment(nonAssociations, res.locals.systemClientToken, prisonerDetailsService)
      ).length

      const prisonerDetailsWithFormattedLocation = {
        ...prisonerDetails,
        assignedLivingUnit: {
          ...prisonerDetails.assignedLivingUnit,
          description: formatLocation(prisonerDetails?.assignedLivingUnit?.description),
        },
      }

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
          ?.map(cell => ({
            ...cell,
            occupants: cellOccupants.filter(occupant => occupant.cellId === cell.id).filter(Boolean),
            spaces: cell.capacity - cell.noOfOccupants,
            type: hasLength(cell.attributes) && cell.attributes.sort(sortByDescription),
          }))
          .sort(sortByDescription),
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
        convertedCsra: translateCsra(prisonerDetails.csraClassificationCode),
        backUrl: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
