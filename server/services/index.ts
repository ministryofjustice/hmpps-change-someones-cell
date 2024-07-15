import { dataAccess } from '../data'
import UserService from './userService'
import FeComponentsService from './feComponentsService'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import PrisonerDetailsService from './prisonerDetailsService'
import LocationService from './locationService'
import NonAssociationsService from './nonAssociationsService'
import AnalyticsService from './analyticsService'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    feComponentsClient,
    prisonApiClient,
    whereaboutsApiClient,
    locationsInsidePrisonApiClient,
    nonAssociationsApiClient,
    googleAnalyticsClient,
    prisonerSearchApiClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient, prisonApiClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const prisonerCellAllocationService = new PrisonerCellAllocationService(
    prisonApiClient,
    whereaboutsApiClient,
    locationsInsidePrisonApiClient,
  )
  const prisonerDetailsService = new PrisonerDetailsService(prisonApiClient, prisonerSearchApiClient)
  const locationService = new LocationService(prisonApiClient, locationsInsidePrisonApiClient)
  const nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient)
  const analyticsService = new AnalyticsService(googleAnalyticsClient)

  return {
    applicationInfo,
    userService,
    feComponentsService,
    prisonerCellAllocationService,
    prisonerDetailsService,
    locationService,
    nonAssociationsService,
    analyticsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
