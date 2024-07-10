import config from '../config'
import RestClient from './restClient'
import { Prisoner } from './prisonerSearchApiClient'

export interface Location {
  prisonId: string
  parentId: string
  key: string
  pathHierarchy: string
  capacity: { maxCapacity: number; workingCapacity?: number }
}

export interface CellLocation {
  id: string
  key: string
  prisonId: string
  pathHierarchy: string
  noOfOccupants: number
  maxCapacity: number
  workingCapacity: number
  localName?: string
  specialistCellTypes: {
    typeCode: string
    typeDescription: string
  }[]
  legacyAttributes: {
    typeCode: string
    typeDescription: string
  }[]
  prisonersInCell?: Prisoner[]
}

export interface LocationGroup {
  name: string
  key: string
  children: {
    key: string
    name: string
  }[]
}

export interface LocationPrefix {
  locationPrefix: string
}

export interface Occupant {
  cellLocation: string
  prisoners: {
    prisonerNumber: string
    firstName: string
    lastName: string
    prisonId: string
    prisonName: string
    cellLocation: string
  }[]
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

  getLocation(token: string, key: string): Promise<Location> {
    return this.restClient(token).get<Location>({ path: `/locations/key/${key}` })
  }

  getInmatesAtLocation(token: string, key: string): Promise<Occupant[]> {
    return this.restClient(token).get<Occupant[]>({
      path: `/prisoner-locations/key/${key}`,
    })
  }

  getCellsWithCapacity(token: string, agencyId: string, groupName: string = null): Promise<CellLocation[]> {
    return this.restClient(token).get<CellLocation[]>({
      path: `/location-occupancy/cells-with-capacity/${agencyId}?includePrisonerInformation=true${
        groupName ? `&groupName=${groupName}` : ''
      }`,
    })
  }
}
