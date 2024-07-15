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
})
