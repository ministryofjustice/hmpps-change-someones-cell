import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import { dataAccess } from '../data'
import logger from '../../logger'
import UserService from './userService'
import FeComponentsService from './feComponentsService'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import PrisonerDetailsService from './prisonerDetailsService'
import LocationService from './locationService'
import NonAssociationsService from './nonAssociationsService'
import AnalyticsService from './analyticsService'
import MetricsService from './metricsService'

export const services = () => {
  const {
    alertsApiClient,
    applicationInfo,
    manageUsersApiClient,
    feComponentsClient,
    prisonApiClient,
    cellMovementsApiClient,
    prisonRegisterApiClient,
    locationsInsidePrisonApiClient,
    nonAssociationsApiClient,
    googleAnalyticsClient,
    prisonerSearchApiClient,
    applicationInsightsClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient, prisonApiClient)
  // reads AUDIT_ENABLED, AUDIT_SQS_REGION, AUDIT_SQS_QUEUE_URL and AUDIT_SERVICE_NAME
  const auditService = AuditServiceFactory.configureFromEnv(logger)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const prisonerCellAllocationService = new PrisonerCellAllocationService(
    alertsApiClient,
    prisonApiClient,
    cellMovementsApiClient,
    locationsInsidePrisonApiClient,
    prisonerSearchApiClient,
  )
  const prisonerDetailsService = new PrisonerDetailsService(prisonApiClient, prisonerSearchApiClient)
  const locationService = new LocationService(prisonRegisterApiClient, locationsInsidePrisonApiClient)
  const nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient)
  const analyticsService = new AnalyticsService(googleAnalyticsClient)
  const metricsService = new MetricsService(applicationInsightsClient)

  return {
    applicationInfo,
    userService,
    auditService,
    feComponentsService,
    prisonerCellAllocationService,
    prisonerDetailsService,
    locationService,
    nonAssociationsService,
    analyticsService,
    metricsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
