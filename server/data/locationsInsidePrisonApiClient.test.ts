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

  describe('activeAgenciesInLocationService', () => {
    it('should return data from info', async () => {
      const response = { activeAgencies: ['MDI', 'BXI'] }

      fakeLocationsInsidePrisonApiClient.get('/info').reply(200, response)

      const output = await locationsInsidePrisonApiClient.getActiveAgenciesInLocationService(accessToken)
      expect(output).toEqual(response)
    })
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

  describe('getLocation', () => {
    it('should return a location from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApiClient
        .get('/locations/key/MDI-1-2-003')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.getLocation(accessToken, 'MDI-1-2-003')
      expect(output).toEqual(response)
    })
  })

  describe('getInmatesAtLocation', () => {
    it('should return occupants from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApiClient
        .get('/prisoner-locations/key/MDI-1-2-003')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.getInmatesAtLocation(accessToken, 'MDI-1-2-003')
      expect(output).toEqual(response)
    })
  })

  describe('getAgencyGroupLocationPrefix', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeLocationsInsidePrisonApiClient
        .get('/locations/prison/MDI/group/Houseblock%201/location-prefix')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await locationsInsidePrisonApiClient.getAgencyGroupLocationPrefix(
        accessToken,
        'MDI',
        'Houseblock 1',
      )
      expect(output).toEqual(response)
    })
  })
})
