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
    return await this.manageUsersApiClient.getUserRoles(token)
  }

  async setActiveCaseload(token: string, caseload: CaseLoad) {
    return await this.prisonApiClient.setActiveCaseload(token, caseload)
  }

  async userCaseLoads(token: string) {
    return await this.prisonApiClient.userCaseLoads(token)
  }
}
