import { PrisonApiClient, WhereaboutsApiClient, LocationsInsidePrisonApiClient } from '../data'
import { Agency, Location, OffenderCell } from '../data/prisonApiClient'
import { LocationGroup, LocationPrefix } from '../data/locationsInsidePrisonApiClient'

export default class LocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly whereaboutsApiClient: WhereaboutsApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
  ) {}

  async searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    const groups = await this.locationsInsidePrisonApiClient.searchGroups(token, agencyId)
    return groups.map(group =>
      group.children.length === 1 ? { name: group.name, key: group.key, children: [] } : group,
    )
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

  async getAgencyDetails(token: string, agencyId: string): Promise<Agency> {
    return await this.prisonApiClient.getAgencyDetails(token, agencyId)
  }
}
