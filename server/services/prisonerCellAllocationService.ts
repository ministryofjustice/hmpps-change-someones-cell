import {
  LocationsInsidePrisonApiClient,
  PrisonApiClient,
  CellMovementsApiClient,
  AlertsApiClient,
  PrisonerSearchApiClient,
} from '../data'
import { Offender } from '../data/prisonApiClient'
import { Alert } from '../data/alertsApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { CellLocation, Location, Occupant, getActualCapacity } from '../data/locationsInsidePrisonApiClient'

/**
 * The capacity check is RECP only - prison-api's `receptionsWithCapacity` looked up
 * `locationCode = "RECP"` and nothing else, so counting anywhere else would make reception
 * look fuller than it is and push users to the reception-full dead end.
 */
export const RECEPTION_CAPACITY_LOCATION = 'RECP'

/**
 * The roll list is wider. prison-api's `GET_OFFENDERS_IN_RECEPTION` matched any uncertified,
 * top-level, unit-typed location (`CERTIFIED_FLAG = 'N' AND UNIT_TYPE IS NOT NULL AND
 * PARENT_INTERNAL_LOCATION_ID IS NULL`) - the virtual set - so restricting to RECP would drop
 * people the screen shows today. Matches locations-inside-prison's own
 * `getReceptionLocationCodes()`, which likewise excludes CSWAP.
 */
export const RECEPTION_ROLL_LOCATIONS = ['RECP', 'COURT', 'TAP']

export interface Reception {
  locationKey: string
  capacity: number
  occupants: number
  hasSpace: boolean
}

export interface ReceptionWithOccupants extends Reception {
  offenders: OffenderWithAlerts[]
}

export interface OffenderWithAlerts {
  offenderNo: string
  firstName: string
  lastName: string
  alerts: string[]
}

export default class PrisonerCellAllocationService {
  constructor(
    private readonly alertsApiClient: AlertsApiClient,
    private readonly prisonApiClient: PrisonApiClient,
    private readonly cellMovementsApiClient: CellMovementsApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
  ) {}

  async getInmates(token: string, locationId: string, keywords?: string, returnAlerts?: boolean): Promise<Offender[]> {
    return this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }

  async getInmatesAtLocation(token: string, locationId: string): Promise<Occupant[]> {
    return this.locationsInsidePrisonApiClient.getInmatesAtLocation(token, locationId)
  }

  async getCellsWithCapacity(
    token: string,
    agencyId: string,
    location: string,
    subLocation?: string,
  ): Promise<CellLocation[]> {
    if (location === 'ALL') {
      return this.locationsInsidePrisonApiClient.getCellsWithCapacity(token, agencyId)
    }

    const groupName = subLocation ? `${location}_${subLocation}` : location
    return this.locationsInsidePrisonApiClient.getCellsWithCapacity(token, agencyId, groupName)
  }

  async getCellMoveReasonTypes(token: string) {
    return this.prisonApiClient.getCellMoveReasonTypes(token)
  }

  // No bookingId on either call: the cell movements API resolves the current booking itself
  // from prisoner-search. bookingId is a NOMIS-only concept being retired from new services.
  async moveToCell(token: string, offenderNo: string, toLocationKey: string, reasonCode: string, commentText: string) {
    return this.cellMovementsApiClient.moveToCell(token, offenderNo, toLocationKey, reasonCode, commentText)
  }

  async moveToCellSwap(token: string, offenderNo: string) {
    return this.cellMovementsApiClient.moveToCellSwap(token, offenderNo)
  }

  async getHistoryByDate(token: string, agencyId: string, assignmentDate: string) {
    return this.prisonApiClient.getHistoryByDate(token, agencyId, assignmentDate)
  }

  async getOffenderCellHistory(token: string, bookingId: number) {
    return this.prisonApiClient.getOffenderCellHistory(token, bookingId)
  }

  /**
   * Whether reception has room, and the key to move someone into.
   *
   * Capacity comes from locations-inside-prison and occupancy from prisoner-search, because LIP
   * cannot report occupancy for a reception: RECP is a VirtualResidentialLocation rather than a
   * Cell, so its `cells-with-capacity` and `prisoner-locations` endpoints both filter it out.
   */
  async getReceptionCapacity(token: string, agencyId: string): Promise<Reception> {
    const [location, prisoners] = await Promise.all([
      this.getReceptionLocation(token, agencyId),
      this.prisonerSearchApiClient.findPrisonersInCellLocations(token, agencyId, [RECEPTION_CAPACITY_LOCATION]),
    ])

    return this.toReception(agencyId, location, prisoners.length)
  }

  /**
   * As [getReceptionCapacity], plus who is currently in reception, with their active alerts.
   *
   * One prisoner-search call serves both answers: the roll set is a superset of the capacity set,
   * so the RECP occupancy is filtered out of the same result rather than fetched again.
   */
  async getReceptionOccupancy(token: string, agencyId: string): Promise<ReceptionWithOccupants> {
    const [location, prisoners] = await Promise.all([
      this.getReceptionLocation(token, agencyId),
      this.prisonerSearchApiClient.findPrisonersInCellLocations(token, agencyId, RECEPTION_ROLL_LOCATIONS),
    ])

    const inReception = prisoners.filter(p => p.cellLocation === RECEPTION_CAPACITY_LOCATION).length

    return {
      ...this.toReception(agencyId, location, inReception),
      offenders: await this.withAlerts(token, agencyId, prisoners),
    }
  }

  private toReception(agencyId: string, location: Location, occupants: number): Reception {
    const locationKey = `${agencyId}-${RECEPTION_CAPACITY_LOCATION}`

    // A prison with no reception is "no space", which is what prison-api's empty list meant.
    if (!location) {
      return { locationKey, capacity: 0, occupants, hasSpace: false }
    }

    const capacity = getActualCapacity(location.capacity)
    return { locationKey, capacity, occupants, hasSpace: occupants < capacity }
  }

  private async getReceptionLocation(token: string, agencyId: string): Promise<Location> {
    const locationKey = `${agencyId}-${RECEPTION_CAPACITY_LOCATION}`
    try {
      return await this.locationsInsidePrisonApiClient.getLocation(token, locationKey)
    } catch (error) {
      if (error.status === 404) {
        logger.warn(`No reception location ${locationKey} in locations-inside-prison`)
        return null
      }
      throw error
    }
  }

  private async withAlerts(token: string, agencyId: string, prisoners: Prisoner[]): Promise<OffenderWithAlerts[]> {
    if (!prisoners || prisoners.length === 0) {
      logger.info(`Agency ${agencyId} has no prisoners in reception`)
      return []
    }

    const alerts = await this.getActiveAlerts(
      token,
      prisoners.map(p => p.prisonerNumber),
    )

    return prisoners.map(prisoner => ({
      offenderNo: prisoner.prisonerNumber,
      firstName: prisoner.firstName,
      lastName: prisoner.lastName,
      alerts: alerts ? this.alertCodesForOffenderNo(alerts, prisoner.prisonerNumber) : [],
    }))
  }

  private async getActiveAlerts(token: string, offenderNumbers: string[]) {
    const alerts = await this.alertsApiClient.getAlertsGlobal(token, offenderNumbers)
    return alerts?.content.filter(alert => alert.isActive)
  }

  private alertCodesForOffenderNo(alerts: Alert[], offenderNo: string) {
    return alerts.filter(alert => alert.prisonNumber === offenderNo).map(alert => alert.alertCode.code)
  }
}
