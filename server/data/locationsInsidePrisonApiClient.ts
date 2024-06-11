import config from '../config'
import RestClient from './restClient'

export interface LocationGroup {
  name: string
  key: string
  children: {
    key: string
    name: string
  }[]
}

export interface CellMoveResponse {
  cellMoveResult: {
    bookingId: number
    agencyId: string
    assignedLivingUnitId: number
    assignedLivingUnitDesc: string
    bedAssignmentHistorySequence: number
    caseNoteId: number
  }
}

export interface LocationPrefix {
  locationPrefix: string
}

export default class LocationsInsidePrisonApiClient {
  constructor() {}

  private restClient(token: string): RestClient {
    return new RestClient('Locations inside prison Api Client', config.apis.locationsInsidePrisonApi, token)
  }

  searchGroups(token: string, prisonId: string): Promise<LocationGroup[]> {
    return this.restClient(token).get<LocationGroup[]>({
      path: `/locations/prison/${prisonId}/groups`,
    })
  }
}
