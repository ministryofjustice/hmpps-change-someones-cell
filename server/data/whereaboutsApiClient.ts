import config from '../config'
import RestClient from './restClient'

export interface LocationGroup {
  name: string
  key: string
  children: string[]
}

export default class WhereaboutsApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Whereabouts Api Client', config.apis.whereaboutsApi, token)
  }

  searchGroups(token: string, agencyId: string): Promise<LocationGroup[]> {
    return WhereaboutsApiClient.restClient(token).get<LocationGroup[]>({
      path: `/agencies/${agencyId}/locations/groups`,
    })
  }
}
