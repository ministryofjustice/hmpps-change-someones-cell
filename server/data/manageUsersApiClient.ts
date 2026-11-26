import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

export interface User {
  username: string
  name?: string
  active?: boolean
  authSource?: string
  userId?: string
  userUuid?: string // This is a UUID created by HMPPS Auth upon first user login that is unique to the user across all authSources
  uuid?: string // deprecated alias for userUuid
  staffId?: number // deprecated, use userId
  activeCaseLoadId?: string // deprecated, use user roles api
}

export interface UserRole {
  roleCode: string
}

export interface PrisonCaseload {
  id: string
  name: string
  function?: string
}

export interface UserCaseloads {
  username: string
  active: boolean
  accountType?: string
  activeCaseload?: PrisonCaseload
  caseloads: PrisonCaseload[]
}

export default class ManageUsersApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Manage Users Api Client', config.apis.manageUsersApi, token)
  }

  getUser(token: string): Promise<User> {
    logger.info('Getting user details: calling HMPPS Manage Users Api')
    return ManageUsersApiClient.restClient(token).get<User>({ path: '/users/me' })
  }

  getUserRoles(token: string): Promise<string[]> {
    return ManageUsersApiClient.restClient(token)
      .get<UserRole[]>({ path: '/users/me/roles' })
      .then(roles => roles.map(role => role.roleCode))
  }

  getUserCaseloads(token: string): Promise<UserCaseloads> {
    return ManageUsersApiClient.restClient(token).get<UserCaseloads>({ path: '/users/me/caseloads' })
  }

  getUserByUsername(token: string, username: string): Promise<User> {
    return ManageUsersApiClient.restClient(token).get<User>({ path: `/users/${encodeURIComponent(username)}` })
  }
}
