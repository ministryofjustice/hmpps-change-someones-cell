import nock from 'nock'

import config from '../config'
import PrisonerSearchApiClient from './prisonerSearchApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('prisonerSearchApiClient', () => {
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

  describe('getPrisoners', () => {
    it('should search for prisoners', async () => {
      const response = { data: 'data' }
      const prisonerNumbers = { prisonerNumbers: ['A1234BC', 'B4321CD'] }

      fakePrisonerSearchApiClient
        .post('/prisoner-search/prisoner-numbers', prisonerNumbers)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonerSearchApiClient.getPrisoners(accessToken, prisonerNumbers.prisonerNumbers)
      expect(output).toEqual(response)
    })
  })
})
