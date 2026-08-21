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

  describe('findPrisonersInCellLocations', () => {
    // Asserting the whole body on purpose: prisoner-search answers a query it does not understand
    // with an empty result rather than an error, which would read here as "reception is empty".
    const expectedBody = {
      joinType: 'AND',
      queries: [
        {
          joinType: 'AND',
          matchers: [
            { type: 'String', attribute: 'prisonId', condition: 'IS', searchTerm: 'MDI' },
            { type: 'String', attribute: 'cellLocation', condition: 'IN', searchTerm: 'RECP,COURT,TAP' },
            { type: 'String', attribute: 'inOutStatus', condition: 'IS', searchTerm: 'IN' },
          ],
        },
      ],
    }

    it('should search for prisoners in the given cell locations', async () => {
      const prisoner = { prisonerNumber: 'A1234BC', firstName: 'JOHN', lastName: 'SMITH' }

      fakePrisonerSearchApiClient
        .post('/attribute-search', expectedBody)
        .query({ size: 2000 })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, { content: [prisoner], totalElements: 1, totalPages: 1 })

      const output = await prisonerSearchApiClient.findPrisonersInCellLocations(accessToken, 'MDI', [
        'RECP',
        'COURT',
        'TAP',
      ])

      expect(output).toEqual([prisoner])
    })

    it('should return an empty list when the search matches nobody', async () => {
      fakePrisonerSearchApiClient
        .post('/attribute-search', expectedBody)
        .query({ size: 2000 })
        .reply(200, { content: [], totalElements: 0, totalPages: 0 })

      const output = await prisonerSearchApiClient.findPrisonersInCellLocations(accessToken, 'MDI', [
        'RECP',
        'COURT',
        'TAP',
      ])

      expect(output).toEqual([])
    })
  })
})
