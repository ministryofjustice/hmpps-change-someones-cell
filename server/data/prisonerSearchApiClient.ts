import config from '../config'
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
      data: { prisonerNumbers },
    })
  }
}
