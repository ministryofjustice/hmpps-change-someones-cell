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
      const prisonerNumber = 'A1234'
      fakeNonAssociationsApiClient
        .get(
          `/prisoner/${prisonerNumber}/non-associations?includeOpen=true&includeClosed=false&includeOtherPrisons=false&sortBy=WHEN_UPDATED&sortDirection=DESC`,
        )
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await nonAssociationsApiClient.getNonAssociations(accessToken, prisonerNumber)
      expect(output).toEqual(response)
    })
  })
})
