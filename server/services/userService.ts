import { convertToTitleCase } from '../utils/utils'
import type { User } from '../data/manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { CaseLoad } from '../data/prisonApiClient'

export interface UserDetails extends User {
  displayName: string
}

const STAFF_CACHE_TTL_MS = 60 * 60 * 1000
const STAFF_CACHE_MAX_ENTRIES = 5000

export default class UserService {
  // Staff names rarely change and the same staff appear on every cell move history page
  private readonly staffCache = new Map<string, { user: User; expiresAt: number }>()

  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUser(token: string): Promise<UserDetails> {
    const user = await this.manageUsersApiClient.getUser(token)
    return { ...user, displayName: convertToTitleCase(user.name) }
  }

  async getUserRoles(token: string): Promise<string[]> {
    return this.manageUsersApiClient.getUserRoles(token)
  }

  async userCaseLoads(token: string): Promise<CaseLoad[]> {
    const { activeCaseload, caseloads = [] } = await this.manageUsersApiClient.getUserCaseloads(token)
    return caseloads.map(caseload => ({
      caseLoadId: caseload.id,
      description: caseload.name,
      currentlyActive: caseload.id === activeCaseload?.id,
    }))
  }

  async getStaffDetails(token: string, username: string): Promise<User | null> {
    const cached = this.staffCache.get(username)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user
    }

    try {
      const user = await this.manageUsersApiClient.getUserByUsername(token, username)
      this.cacheStaff(username, user)
      return user
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  private cacheStaff(username: string, user: User) {
    if (this.staffCache.size >= STAFF_CACHE_MAX_ENTRIES) {
      this.staffCache.delete(this.staffCache.keys().next().value)
    }
    this.staffCache.set(username, { user, expiresAt: Date.now() + STAFF_CACHE_TTL_MS })
  }
}
