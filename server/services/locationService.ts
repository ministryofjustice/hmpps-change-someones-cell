import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Location } from '../data/prisonApiClient'
import { LocationGroup } from '../data/whereaboutsApiClient'

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
}
