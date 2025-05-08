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
import WhereaboutsApiClient from './whereaboutsApiClient'
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
  whereaboutsApiClient: new WhereaboutsApiClient(),
  locationsInsidePrisonApiClient: new LocationsInsidePrisonApiClient(),
  nonAssociationsApiClient: new NonAssociationsApiClient(),
  googleAnalyticsClient: new GoogleAnalyticsClient(),
  prisonerSearchApiClient: new PrisonerSearchApiClient(),
  applicationInsightsClient,
})

export type DataAccess = ReturnType<typeof dataAccess>

export {
  HmppsAuthClient,
  RestClientBuilder,
  ManageUsersApiClient,
  PrisonApiClient,
  WhereaboutsApiClient,
  LocationsInsidePrisonApiClient,
  NonAssociationsApiClient,
  GoogleAnalyticsClient,
  PrisonerSearchApiClient,
  applicationInsightsClient,
}
