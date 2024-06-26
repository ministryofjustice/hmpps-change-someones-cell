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

  describe('moveToCell', () => {
    it('should return data from api', async () => {
      const requestData = {
        bookingId: 300,
        offenderNo: 'AB4000C',
        internalLocationDescriptionDestination: 'blah',
        cellMoveReasonCode: 'bleh',
        commentText: 'cool',
      }

      const response = { data: 'data' }

      fakeWhereaboutsApiClient
        .post('/cell/make-cell-move', requestData)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await whereaboutsApiClient.moveToCell(accessToken, 300, 'AB4000C', 'blah', 'bleh', 'cool')
      expect(output).toEqual(response)
    })
  })

  describe('getAgencyGroupLocationPrefix', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeWhereaboutsApiClient
        .get('/locations/MDI/Houseblock%201/location-prefix')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await whereaboutsApiClient.getAgencyGroupLocationPrefix(accessToken, 'MDI', 'Houseblock 1')
      expect(output).toEqual(response)
    })
  })
})
