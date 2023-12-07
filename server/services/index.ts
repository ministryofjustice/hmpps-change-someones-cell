import { dataAccess } from '../data'
import UserService from './userService'
import FeComponentsService from './feComponentsService'
import apis from '../apis'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, feComponentsClient } = dataAccess()

  const userService = new UserService(manageUsersApiClient)
  const feComponentsService = new FeComponentsService(feComponentsClient)

  return {
    apis,
    applicationInfo,
    userService,
    feComponentsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
