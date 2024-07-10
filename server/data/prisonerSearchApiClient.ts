import config from '../config'
import { OffenderDetails, Page } from './prisonApiClient'
import RestClient from './restClient'

export interface Prisoner {
  prisonerNumber: string
  bookingId?: number
  firstName: string
  middleName?: string
  lastName: string
  gender: string
  prisonId: string
  prisonName: string
  cellLocation?: string
  csra?: string
  category?: string
  mostSeriousOffence?: string
  alerts: Alert[]
}

export interface Alert {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}

export default class PrisonerSearchApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Prisoner Search Api Client', { ...config.apis.prisonerSearchApi, ...extraConfig }, token)
  }

  getPrisoner(token: string, prisonerNumber: string): Promise<Prisoner> {
    return PrisonerSearchApiClient.restClient(token).get<Prisoner>({
      path: `/prisoner/${prisonerNumber}`,
    })
  }

  getPrisoners(token: string, prisonerNumbers: string[]): Promise<Prisoner[]> {
    return PrisonerSearchApiClient.restClient(token).post<Prisoner[]>({
      path: `/prisoner-search/prisoner-numbers`,
      data: prisonerNumbers,
    })
  }

  getPrisonersAtLocations(token: string, prisonId: string, locations: string[]): Promise<Page<Prisoner>> {
    return PrisonerSearchApiClient.restClient(token).post<Page<Prisoner>>({
      path: '/attribute-search',
      query: {
        size: 10000,
      },
      data: {
        joinType: 'AND',
        queries: [
          {
            joinType: 'AND',
            matchers: [
              {
                type: 'String',
                attribute: 'prisonId',
                condition: 'IS',
                searchTerm: prisonId,
              },
              {
                type: 'String',
                attribute: 'cellLocation',
                condition: 'IN',
                searchTerm: locations.join(','),
              },
            ],
          },
        ],
      },
    })
  }
}
