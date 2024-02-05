import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Location, OffenderCell } from '../data/prisonApiClient'
import { LocationGroup, LocationPrefix } from '../data/whereaboutsApiClient'

export default class LocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
  ) {}

  async searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    return await this.whereaboutsApiClient.searchGroups(token, agencyId)
  }

  async getLocation(token: string, livingUnitId: number): Promise<Location> {
    return await this.prisonApiClient.getLocation(token, livingUnitId)
  }

  async getAttributesForLocation(token: string, locationId: number): Promise<OffenderCell> {
    return await this.prisonApiClient.getAttributesForLocation(token, locationId)
  }

  async getAgencyGroupLocationPrefix(token: string, agencyId: string, groupName: string): Promise<LocationPrefix> {
    try {
      return await this.whereaboutsApiClient.getAgencyGroupLocationPrefix(token, agencyId, groupName)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }
}
