import config from '../config'
import RestClient from './restClient'

interface AlertCode {
  code: string
}

export interface Alert {
  prisonNumber: string
  alertCode: AlertCode
  isActive: boolean
}

interface Alerts {
  content: Alert[]
}

export default class AlertsApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Alerts Api Client', { ...config.apis.alertsApi, ...extraConfig }, token)
  }

  getAlertsGlobal(token: string, offenderNos: string[]) {
    return AlertsApiClient.restClient(token).post<Alerts>({
      path: '/search/alerts/prison-numbers',
      data: offenderNos,
    })
  }
}
