import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Offender } from '../data/prisonApiClient'

export default class PrisonerCellAllocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
  ) {}

  async getInmates(token: string, locationId: string, keywords?: string, returnAlerts?: boolean): Promise<Offender[]> {
    return await this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }

  async getInmatesAtLocation(token: string, locationId: number) {
    return await this.prisonApiClient.getInmatesAtLocation(token, locationId)
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
}
