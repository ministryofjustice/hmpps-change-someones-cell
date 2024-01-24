import { WhereaboutsApiClient } from '../data'
import { LocationGroup } from '../data/whereaboutsApiClient'

export default class LocationService {
  constructor(private readonly whereaboutsApiClient: WhereaboutsApiClient) {}

  async searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    return await this.whereaboutsApiClient.searchGroups(token, agencyId)
  }
}
