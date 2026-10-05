import {
  LocationsInsidePrisonApiClient,
  PrisonApiClient,
  CellMovementsApiClient,
  AlertsApiClient,
  PrisonerSearchApiClient,
} from '../data'
import { CellMoveReason } from '../data/cellMovementsApiClient'
import { Alert } from '../data/alertsApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { CellLocation, Occupant, ReceptionOccupancy, getActualCapacity } from '../data/locationsInsidePrisonApiClient'

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

  /**
   * Prisoners in one prison, narrowed either by a name/number term or by a residential location
   * prefix such as `MDI-1`.
   *
   * Replaced prison-api's `getInmates` (MAPA-318). The response already carries alerts and category,
   * so callers no longer make a second prisoner-search call to top those up.
   */
  async searchInmates(
    token: string,
    prisonId: string,
    filters: { term?: string; cellLocationPrefix?: string },
  ): Promise<Prisoner[]> {
    return this.prisonerSearchApiClient.findPrisonersInPrison(token, prisonId, filters)
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

  /**
   * In display order, and including retired reasons - see
   * [CellMovementsApiClient.getCellMoveReasons]. Callers offering a choice filter on `active`;
   * callers resolving a historic code must not.
   */
  async getCellMoveReasonTypes(token: string): Promise<CellMoveReason[]> {
    return this.cellMovementsApiClient.getCellMoveReasons(token)
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
   * locations-inside-prison owns the reception rules (MAPA-311): space is for RECP alone and is
   * never offered when RECP is missing or inactive, and the roll covers RECP, COURT and TAP. So
   * `hasSpace` is taken as given rather than worked out here.
   */
  async getReceptionCapacity(token: string, agencyId: string): Promise<Reception> {
    return this.toReception(await this.locationsInsidePrisonApiClient.getReceptionOccupancy(token, agencyId))
  }

  /**
   * As [getReceptionCapacity], plus who is currently in reception, with their active alerts.
   */
  async getReceptionOccupancy(token: string, agencyId: string): Promise<ReceptionWithOccupants> {
    const reception = await this.locationsInsidePrisonApiClient.getReceptionOccupancy(token, agencyId)

    return {
      ...this.toReception(reception),
      offenders: await this.withAlerts(token, agencyId, reception.prisoners),
    }
  }

  private toReception(reception: ReceptionOccupancy): Reception {
    return {
      locationKey: reception.key,
      capacity: getActualCapacity(reception),
      occupants: reception.noOfOccupants,
      hasSpace: reception.hasSpace,
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
