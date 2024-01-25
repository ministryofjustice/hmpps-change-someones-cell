import { dataAccess } from '../data'
import UserService from './userService'
import FeComponentsService from './feComponentsService'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import PrisonerDetailsService from './prisonerDetailsService'
import LocationService from './locationService'
import NonAssociationsService from './nonAssociationsService'

export const services = () => {
  const {
    applicationInfo,
    manageUsersApiClient,
    feComponentsClient,
    prisonApiClient,
    whereaboutsApiClient,
    nonAssociationsApiClient,
  } = dataAccess()

  const userService = new UserService(manageUsersApiClient, prisonApiClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const prisonerCellAllocationService = new PrisonerCellAllocationService(prisonApiClient, whereaboutsApiClient)
  const prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
  const locationService = new LocationService(prisonApiClient, whereaboutsApiClient)
  const nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient)

  return {
    applicationInfo,
    userService,
    feComponentsService,
    prisonerCellAllocationService,
    prisonerDetailsService,
    locationService,
    nonAssociationsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
