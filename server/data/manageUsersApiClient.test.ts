import nock from 'nock'

import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'

jest.mock('./tokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('manageUsersApiClient', () => {
  let fakeManageUsersApiClient: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    fakeManageUsersApiClient = nock(config.apis.manageUsersApi.url)
    manageUsersApiClient = new ManageUsersApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeManageUsersApiClient
        .get('/users/me')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUser(token.access_token)
      expect(output).toEqual(response)
    })
  })

  describe('getUserRoles', () => {
    it('should return data from api', async () => {
      fakeManageUsersApiClient
        .get('/users/me/roles')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, [{ roleCode: 'role1' }, { roleCode: 'role2' }])

      const output = await manageUsersApiClient.getUserRoles(token.access_token)
      expect(output).toEqual(['role1', 'role2'])
    })
  })

  describe('getUserCaseloads', () => {
    it('should return data from api', async () => {
      const response = {
        username: 'SGAMGEE_GEN',
        active: true,
        activeCaseload: { id: 'MDI', name: 'Moorland (HMP & YOI)' },
        caseloads: [{ id: 'MDI', name: 'Moorland (HMP & YOI)' }],
      }

      fakeManageUsersApiClient
        .get('/users/me/caseloads')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUserCaseloads(token.access_token)
      expect(output).toEqual(response)
    })
  })

  describe('getUserByUsername', () => {
    it('should return data from api', async () => {
      const response = { username: 'SGAMGEE_GEN', name: 'Sam Gamgee' }

      fakeManageUsersApiClient
        .get('/users/SGAMGEE_GEN')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await manageUsersApiClient.getUserByUsername(token.access_token, 'SGAMGEE_GEN')
      expect(output).toEqual(response)
    })
  })
})
