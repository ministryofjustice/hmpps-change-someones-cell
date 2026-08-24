import { PrisonRegisterApiClient, LocationsInsidePrisonApiClient } from '../data'
import { Location, LocationGroup, LocationPrefix } from '../data/locationsInsidePrisonApiClient'

export default class LocationService {
  constructor(
    private readonly prisonRegisterApiClient: PrisonRegisterApiClient,
    private readonly locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient,
  ) {}

  async searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    const groups = await this.locationsInsidePrisonApiClient.searchGroups(token, agencyId)
    return groups.map(group =>
      group.children.length === 1 ? { name: group.name, key: group.key, children: [] } : group,
    )
  }

  async getLocation(token: string, key: string): Promise<Location> {
    return this.locationsInsidePrisonApiClient.getLocation(token, key)
  }

  async getActiveAgenciesInLocationService(token: string, prisonId: string): Promise<boolean> {
    const locationInfo = await this.locationsInsidePrisonApiClient.getActiveAgenciesInLocationService(token)
    return locationInfo.activeAgencies.includes(prisonId) || locationInfo.activeAgencies.includes('***')
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

  // Sourced from prison-register rather than prison-api: the caller only needs the prison's
  // name, and the register is the source of truth for prisons with no role required.
  async getAgencyDetails(token: string, agencyId: string): Promise<{ agencyId: string; description: string }> {
    const prison = await this.prisonRegisterApiClient.getPrisonById(token, agencyId)
    return { agencyId: prison.prisonId, description: prison.prisonName }
  }
}
