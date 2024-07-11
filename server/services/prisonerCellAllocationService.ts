import { LocationsInsidePrisonApiClient, PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Alert, Offender, OffenderInReception } from '../data/prisonApiClient'
import logger from '../../logger'
import { CellLocation, Occupant } from '../data/locationsInsidePrisonApiClient'

export interface OffenderWithAlerts extends OffenderInReception {
  alerts?: string[]
}

export default class PrisonerCellAllocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
  ) {}

  async getInmates(token: string, locationId: string, keywords?: string, returnAlerts?: boolean): Promise<Offender[]> {
    return await this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }

  async getInmatesAtLocation(token: string, locationId: string): Promise<Occupant[]> {
    return await this.locationsInsidePrisonApiClient.getInmatesAtLocation(token, locationId)
  }

  async getCellsWithCapacity(
    token: string,
    agencyId: string,
    location: string,
    subLocation?: string,
  ): Promise<CellLocation[]> {
    if (location === 'ALL') {
      return await this.locationsInsidePrisonApiClient.getCellsWithCapacity(token, agencyId)
    }

    const groupName = subLocation ? `${location}_${subLocation}` : location
    return await this.locationsInsidePrisonApiClient.getCellsWithCapacity(token, agencyId, groupName)
  }

  async getCellMoveReasonTypes(token: string) {
    return await this.prisonApiClient.getCellMoveReasonTypes(token)
  }

  async moveToCell(
    token: string,
    bookingId: number,
    offenderNo: string,
    internalLocationDescriptionDestination: string,
    cellMoveReasonCode: string,
    commentText: string,
  ) {
    return await this.whereaboutsApiClient.moveToCell(
      token,
      bookingId,
      offenderNo,
      internalLocationDescriptionDestination,
      cellMoveReasonCode,
      commentText,
    )
  }

  async moveToCellSwap(token: string, bookingId: number) {
    return await this.prisonApiClient.moveToCellSwap(token, bookingId)
  }

  async getHistoryByDate(token: string, agencyId: string, assignmentDate: string) {
    return await this.prisonApiClient.getHistoryByDate(token, agencyId, assignmentDate)
  }

  async getOffenderCellHistory(token: string, bookingId: number) {
    return await this.prisonApiClient.getOffenderCellHistory(token, bookingId)
  }

  async getReceptionsWithCapacity(token: string, agencyId: string) {
    return await this.prisonApiClient.getReceptionsWithCapacity(token, agencyId)
  }

  async getOffendersInReception(token: string, agencyId: string): Promise<OffenderWithAlerts[]> {
    const offenders = await this.prisonApiClient.getOffendersInReception(token, agencyId)

    if (!offenders || offenders.length === 0) {
      logger.info(`Agency ${agencyId} has no prisoners in reception`)
      return []
    }

    const offenderNumbers = offenders.map(o => o.offenderNo)
    const alerts = await this.getActiveAlerts(token, offenderNumbers)

    return this.addAlerts(offenders, alerts)
  }

  private async getActiveAlerts(token: string, offenderNumbers: string[]) {
    const alerts = await this.prisonApiClient.getAlertsGlobal(token, offenderNumbers)
    return alerts?.filter(alert => !alert.expired)
  }

  private addAlerts(objects: OffenderInReception[], alerts: Alert[]) {
    return alerts
      ? objects.map(obj => ({
          ...obj,
          alerts: this.alertCodesForOffenderNo(alerts, obj.offenderNo),
        }))
      : objects
  }

  private alertCodesForOffenderNo(alerts: Alert[], offenderNo: string) {
    return alerts.filter(alert => alert.offenderNo === offenderNo).map(alert => alert.alertCode)
  }
}
