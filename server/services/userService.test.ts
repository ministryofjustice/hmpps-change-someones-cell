import UserService from './userService'
import ManageUsersApiClient, { type User } from '../data/manageUsersApiClient'
import { SanitisedError } from '../sanitisedError'

jest.mock('../data/manageUsersApiClient')

const token = 'some token'

describe('User service', () => {
  let manageUsersApiClient: jest.Mocked<ManageUsersApiClient>
  let userService: UserService

  describe('getUser', () => {
    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      userService = new UserService(manageUsersApiClient)
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
      userService = new UserService(manageUsersApiClient)
    })

    it('maps Manage Users caseloads to the caseload shape the app uses', async () => {
      manageUsersApiClient.getUserCaseloads.mockResolvedValue({
        username: 'SGAMGEE_GEN',
        active: true,
        activeCaseload: { id: 'BXI', name: 'Brixton (HMP)' },
        caseloads: [
          { id: 'BXI', name: 'Brixton (HMP)' },
          { id: 'MDI', name: 'Moorland (HMP & YOI)' },
        ],
      })

      const result = await userService.userCaseLoads(token)

      expect(result).toEqual([
        { caseLoadId: 'BXI', description: 'Brixton (HMP)', currentlyActive: true },
        { caseLoadId: 'MDI', description: 'Moorland (HMP & YOI)', currentlyActive: false },
      ])
    })

    it('returns no caseloads when the user has none', async () => {
      manageUsersApiClient.getUserCaseloads.mockResolvedValue({
        username: 'SGAMGEE_GEN',
        active: true,
        caseloads: [],
      })

      const result = await userService.userCaseLoads(token)

      expect(result).toEqual([])
    })

    it('propagates error', async () => {
      manageUsersApiClient.getUserCaseloads.mockRejectedValue(new Error('some error'))

      await expect(userService.userCaseLoads(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getStaffDetails', () => {
    const staff: User = { username: 'SGAMGEE_GEN', name: 'Sam Gamgee' }

    beforeEach(() => {
      manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
      userService = new UserService(manageUsersApiClient)
    })

    it('retrieves staff details from Manage Users', async () => {
      manageUsersApiClient.getUserByUsername.mockResolvedValue(staff)

      const result = await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(result).toEqual(staff)
      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledWith(token, 'SGAMGEE_GEN')
    })

    it('only calls Manage Users once for the same staff member', async () => {
      manageUsersApiClient.getUserByUsername.mockResolvedValue(staff)

      await userService.getStaffDetails(token, 'SGAMGEE_GEN')
      const result = await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(result).toEqual(staff)
      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledTimes(1)
    })

    it('calls Manage Users again once the cached entry has expired', async () => {
      const now = jest.spyOn(Date, 'now').mockReturnValue(0)
      manageUsersApiClient.getUserByUsername.mockResolvedValue(staff)

      await userService.getStaffDetails(token, 'SGAMGEE_GEN')
      now.mockReturnValue(60 * 60 * 1000 + 1)
      await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(manageUsersApiClient.getUserByUsername).toHaveBeenCalledTimes(2)
      now.mockRestore()
    })

    it('returns null when not found', async () => {
      const notFoundError: SanitisedError = {
        message: '404 Not Found',
        name: '404 Not Found',
        stack: 'stack',
        status: 404,
      }

      manageUsersApiClient.getUserByUsername.mockRejectedValue(notFoundError)

      const result = await userService.getStaffDetails(token, 'SGAMGEE_GEN')

      expect(result).toEqual(null)
    })

    it('propagates other errors', async () => {
      manageUsersApiClient.getUserByUsername.mockRejectedValue(new Error('some error'))

      await expect(userService.getStaffDetails(token, 'SGAMGEE_GEN')).rejects.toEqual(new Error('some error'))
    })
  })
})
