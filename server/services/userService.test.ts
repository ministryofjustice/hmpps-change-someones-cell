import UserService from './userService'
import ManageUsersApiClient, { type User } from '../data/manageUsersApiClient'
import { PrisonApiClient } from '../data'
import { SanitisedError } from '../sanitisedError'
import { UserDetail } from '../data/prisonApiClient'

jest.mock('../data/manageUsersApiClient')
jest.mock('../data/prisonApiClient')

const token = 'some token'

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let userService: UserService

  describe('getUser', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      userService = new UserService(manageUsersApiClient, prisonApiClient)
    })

    it('retrieves and formats user name', async () => {
      manageUsersApiClient.getUser.mockResolvedValue({ name: 'john smith' } as User)

      const result = await userService.getUser(token)

      expect(result.displayName).toEqual('John Smith')
    })

    it('propagates error', async () => {
      manageUsersApiClient.getUser.mockRejectedValue(new Error('some error'))

      await expect(userService.getUser(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('userCaseLoads', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      userService = new UserService(manageUsersApiClient, prisonApiClient)
    })

    const caseLoads = [
      {
        caseLoadId: 'BXI',
        description: 'Brixton (HMP)',
        currentlyActive: true,
      },
    ]

    it('retrieves user case loads', async () => {
      prisonApiClient.userCaseLoads.mockResolvedValue(caseLoads)

      const result = await userService.userCaseLoads(token)

      expect(result).toEqual(caseLoads)
    })

    it('propagates error', async () => {
      prisonApiClient.userCaseLoads.mockRejectedValue(new Error('some error'))

      await expect(userService.userCaseLoads(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getStaffDetails', () => {
    const userDetail: UserDetail = {
      staffId: 231232,
      username: 'SGAMGEE_GEN',
      firstName: 'John',
      lastName: 'Smith',
      thumbnailId: 2342341224,
      activeCaseLoadId: 'MDI',
      accountStatus: 'ACTIVE',
      lockDate: '2021-07-05T10:35:17',
      expiryDate: '2021-07-05T10:35:17',
      lockedFlag: false,
      expiredFlag: true,
      active: true,
    }

    it('retrieves staff details', async () => {
      prisonApiClient.getStaffDetails.mockResolvedValue(userDetail)

      const result = await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(result).toEqual(userDetail)
    })

    it('returns null when not found', async () => {
      const notFoundError: SanitisedError = {
        message: '404 Not Found',
        name: '404 Not Found',
        stack: 'stack',
        status: 404,
      }

      prisonApiClient.getStaffDetails.mockRejectedValue(notFoundError)

      const result = await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(result).toEqual(null)
    })

    it('propagates other errors', async () => {
      prisonApiClient.getStaffDetails.mockRejectedValue(new Error('some error'))

      await expect(userService.getStaffDetails(token, 'SGAMGEE_GEN')).rejects.toEqual(new Error('some error'))
    })
  })
})
