import nock from 'nock'

import config from '../config'
import PrisonerSearchApiClient from './prisonerSearchApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('prisonApiClient', () => {
  let fakePrisonerSearchApiClient: nock.Scope
  let prisonerSearchApiClient: PrisonerSearchApiClient

  beforeEach(() => {
    fakePrisonerSearchApiClient = nock(config.apis.prisonerSearchApi.url)
    prisonerSearchApiClient = new PrisonerSearchApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getPrisonersAtLocations', () => {
    it('should return data from api', async () => {
      const params = {
        joinType: 'AND',
        queries: [
          {
            joinType: 'AND',
            matchers: [
              {
                type: 'String',
                attribute: 'prisonId',
                condition: 'IS',
                searchTerm: 'MDI',
              },
              {
                type: 'String',
                attribute: 'cellLocation',
                condition: 'IN',
                searchTerm: 'A-1-001,A-1-002',
              },
            ],
          },
        ],
      }

      const response = { data: 'data' }

      fakePrisonerSearchApiClient
        .post('/attribute-search', params)
        .query({ size: 10000 })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.getPrisonersAtLocations(accessToken, 'MDI', ['A-1-001', 'A-1-002'])
      expect(output).toEqual(response)
    })
  })
})
