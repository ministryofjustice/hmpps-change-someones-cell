import config from '../config'
import RestClient from './restClient'

export interface Alert {
  alertUuid: string
  prisonNumber: string
  alertCode: {
    alertTypeCode: string
    alertTypeDescription: string
    code: string
    description: string
  }
  description: string
  authorisedBy: string
  activeFrom: string
  activeTo: string
  isActive: boolean
  createdAt: string
  createdBy: string
  createdByDisplayName: string
  lastModifiedAt: string
  lastModifiedBy: string
  lastModifiedByDisplayName: string
  activeToLastSetAt: string
  activeToLastSetBy: string
  activeToLastSetByDisplayName: string
  madeInactiveAt: string
  madeInactiveBy: string
  madeInactiveByDisplayName: string
  prisonCodeWhenCreated: string
}

export default class AlertsApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Prisoner Alerts Api Client', { ...config.apis.prisonerAlertsApi, ...extraConfig }, token)
  }

  getAlerts(token: string, offenderNumbers: string[]) {
    return AlertsApiClient.restClient(token).post<{ content: Alert[] }>({
        path: `/search/alerts/prison-numbers`,
        data: offenderNumbers,
      }).then(response => response.content)
  }
}