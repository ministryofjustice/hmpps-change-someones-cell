import { dataAccess } from '../data'
import UserService from './userService'
import FeComponentsService from './feComponentsService'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import PrisonerDetailsService from './prisonerDetailsService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, feComponentsClient, prisonApiClient, hmppsAuthClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient, prisonApiClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const prisonerCellAllocationService = new PrisonerCellAllocationService(prisonApiClient, hmppsAuthClient)
  const prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)

  return {
    applicationInfo,
    userService,
    feComponentsService,
    prisonerCellAllocationService,
    prisonerDetailsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
