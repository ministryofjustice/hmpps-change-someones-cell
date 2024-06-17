import nock from 'nock'

import config from '../config'
import LocationsInsidePrisonApiClient from './locationsInsidePrisonApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('LocationsInsidePrisonApiClient', () => {
  let fakeLocationsInsidePrisonApiClient: nock.Scope
  let locationsInsidePrisonApiClient: LocationsInsidePrisonApiClient

  beforeEach(() => {
    fakeLocationsInsidePrisonApiClient = nock(config.apis.locationsInsidePrisonApi.url)
    locationsInsidePrisonApiClient = new LocationsInsidePrisonApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('searchGroups', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApiClient
        .get('/locations/prison/BXI/groups')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.searchGroups(accessToken, 'BXI')
      expect(output).toEqual(response)
    })
  })
})
