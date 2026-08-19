import { LocationsInsidePrisonApiClient, PrisonApiClient, CellMovementsApiClient, AlertsApiClient } from '../data'
import { Offender, OffenderInReception } from '../data/prisonApiClient'
import { Alert } from '../data/alertsApiClient'
import logger from '../../logger'
import { CellLocation, Occupant } from '../data/locationsInsidePrisonApiClient'

export interface OffenderWithAlerts extends OffenderInReception {
  alerts?: string[]
}

export default class PrisonerCellAllocationService {
  constructor(
    private readonly alertsApiClient: AlertsApiClient,
    private readonly prisonApiClient: PrisonApiClient,
    private readonly cellMovementsApiClient: CellMovementsApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
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

  async getReceptionsWithCapacity(token: string, agencyId: string) {
    return this.prisonApiClient.getReceptionsWithCapacity(token, agencyId)
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
    const alerts = await this.alertsApiClient.getAlertsGlobal(token, offenderNumbers)
    return alerts?.content.filter(alert => alert.isActive)
  }

  private addAlerts(offenders: OffenderInReception[], alerts: Alert[]) {
    return alerts
      ? offenders.map(offender => ({
          ...offender,
          alerts: this.alertCodesForOffenderNo(alerts, offender.offenderNo),
        }))
      : offenders
  }

  private alertCodesForOffenderNo(alerts: Alert[], offenderNo: string) {
    return alerts.filter(alert => alert.prisonNumber === offenderNo).map(alert => alert.alertCode.code)
  }
}
