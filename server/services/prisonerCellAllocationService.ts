import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Alert, Offender, OffenderInReception } from '../data/prisonApiClient'
import logger from '../../logger'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'

export interface OffenderWithAlerts extends OffenderInReception {
  alerts?: string[]
}

export default class PrisonerCellAllocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
  ) {}

  async getInmates(token: string, locationId: string, keywords?: string, returnAlerts?: boolean): Promise<Offender[]> {
    return await this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }

  async getPrisonersAtLocations(token: string, agencyId, locationDescriptions: string[]) {
    const result = await this.prisonerSearchApiClient.getPrisonersAtLocations(token, agencyId, locationDescriptions)
    return result.content
  }

  async getCellsWithCapacity(token: string, agencyId: string, location: string, subLocation?: string) {
    // If the location is 'ALL' we do not need to call the whereabouts API,
    // we can directly call prisonApi.
    if (location === 'ALL') {
      return await this.prisonApiClient.getCellsWithCapacity(token, agencyId)
    }

    const groupName = subLocation ? `${location}_${subLocation}` : location
    return await this.whereaboutsApiClient.getCellsWithCapacity(token, agencyId, groupName)
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
