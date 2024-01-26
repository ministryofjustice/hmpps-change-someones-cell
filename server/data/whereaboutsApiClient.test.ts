import nock from 'nock'

import config from '../config'
import WhereaboutsApiClient from './whereaboutsApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('whereaboutsApiClient', () => {
  let fakeWhereaboutsApiClient: nock.Scope
  let whereaboutsApiClient: WhereaboutsApiClient

  beforeEach(() => {
    fakeWhereaboutsApiClient = nock(config.apis.whereaboutsApi.url)
    whereaboutsApiClient = new WhereaboutsApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('searchGroups', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApiClient
        .get('/agencies/BXI/locations/groups')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await whereaboutsApiClient.searchGroups(accessToken, 'BXI')
      expect(output).toEqual(response)
    })
  })

  describe('getCellsWithCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApiClient
        .get('/locations/cellsWithCapacity/BXI/location_sublocation')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await whereaboutsApiClient.getCellsWithCapacity(accessToken, 'BXI', 'location_sublocation')
      expect(output).toEqual(response)
    })
  })
})
