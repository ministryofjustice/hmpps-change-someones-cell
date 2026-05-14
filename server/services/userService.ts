import { convertToTitleCase } from '../utils/utils'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import PrisonApiClient, { CaseLoad } from '../data/prisonApiClient'

export interface UserDetails extends User {
  displayName: string
}

export default class UserService {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly prisonApiClient: PrisonApiClient,
  ) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    return { ...user, displayName: convertToTitleCase(user.name) }
  }

  async getUserRoles(token: string): Promise<string[]> {
    return this.manageUsersApiClient.getUserRoles(token)
  }

  async setActiveCaseload(token: string, caseload: CaseLoad) {
    return this.prisonApiClient.setActiveCaseload(token, caseload)
  }

  async userCaseLoads(token: string) {
    return this.prisonApiClient.userCaseLoads(token)
  }

  async getStaffDetails(token: string, username: string) {
    try {
      return await this.prisonApiClient.getStaffDetails(token, username)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }
}
