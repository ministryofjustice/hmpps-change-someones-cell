import nock from 'nock'

import config from '../config'
import NonAssociationsApiClient from './nonAssociationsApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('nonAssociationsApiClient', () => {
  let fakeNonAssociationsApiClient: nock.Scope
  let nonAssociationsApiClient: NonAssociationsApiClient

  beforeEach(() => {
    fakeNonAssociationsApiClient = nock(config.apis.nonAssociationsApi.url)
    nonAssociationsApiClient = new NonAssociationsApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getNonAssociations', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakeNonAssociationsApiClient
        .get('/legacy/api/offenders/A1234/non-association-details')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await nonAssociationsApiClient.getNonAssociations(accessToken, 'A1234')
      expect(output).toEqual(response)
    })
  })
})
