import config from '../config'
import RestClient from './restClient'
import { Alert } from './prisonApiClient'

interface ActiveAlert {
  isActive: boolean
}

interface AlertsApiAlert extends Alert {
  content: ActiveAlert[]
}

export default class AlertsApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Alerts Api Client', { ...config.apis.alertsApi, ...extraConfig }, token)
  }

  getAlertsGlobal(token: string, offenderNos: string[]) {
    return AlertsApiClient.restClient(token).post<AlertsApiAlert>({
      path: '/search/alerts/prison-numbers',
      data: offenderNos,
    })
  }
}
