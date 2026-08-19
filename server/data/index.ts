/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
const applicationInsightsClient = buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import ManageUsersApiClient from './manageUsersApiClient'
import { createRedisClient } from './redisClient'
import TokenStore from './tokenStore'
import FeComponentsClient from './feComponentsClient'
import PrisonApiClient from './prisonApiClient'
import AlertsApiClient from './alertsApiClient'
import CellMovementsApiClient from './cellMovementsApiClient'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'
import NonAssociationsApiClient from './nonAssociationsApiClient'
import GoogleAnalyticsClient from './googleAnalyticsClient'
import PrisonerSearchApiClient from './prisonerSearchApiClient'

type RestClientBuilder<T> = (token: string) => T

export const dataAccess = () => ({
  applicationInfo,
  hmppsAuthClient: new HmppsAuthClient(new TokenStore(createRedisClient())),
  manageUsersApiClient: new ManageUsersApiClient(),
  feComponentsClient: new FeComponentsClient(),
  prisonApiClient: new PrisonApiClient(),
  alertsApiClient: new AlertsApiClient(),
  cellMovementsApiClient: new CellMovementsApiClient(),
  locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(),
  nonAssociationsApiClient: new NonAssociationsApiClient(),
  googleAnalyticsClient: new GoogleAnalyticsClient(),
  prisonerSearchApiClient: new PrisonerSearchApiClient(),
  applicationInsightsClient,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  AlertsApiClient,
  HmppsAuthClient,
  ManageUsersApiClient,
  PrisonApiClient,
  CellMovementsApiClient,
  LocationsInsidePrisonApiClient,
  NonAssociationsApiClient,
  GoogleAnalyticsClient,
  PrisonerSearchApiClient,
  applicationInsightsClient,
}
export type { RestClientBuilder }
