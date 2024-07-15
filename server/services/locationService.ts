import { PrisonApiClient, LocationsInsidePrisonApiClient } from '../data'
import { Agency } from '../data/prisonApiClient'
import { Location, LocationGroup, LocationPrefix } from '../data/locationsInsidePrisonApiClient'

export default class LocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
  ) {}

  async searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    const groups = await this.locationsInsidePrisonApiClient.searchGroups(token, agencyId)
    return groups.map(group =>
      group.children.length === 1 ? { name: group.name, key: group.key, children: [] } : group,
    )
  }

  async getLocation(token: string, key: string): Promise<Location> {
    return await this.locationsInsidePrisonApiClient.getLocation(token, key)
  }

  async getAgencyGroupLocationPrefix(token: string, agencyId: string, groupName: string): Promise<LocationPrefix> {
    try {
      return await this.locationsInsidePrisonApiClient.getAgencyGroupLocationPrefix(token, agencyId, groupName)
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
