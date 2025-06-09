import nock from 'nock'

import config from '../config'
import AlertsApiClient from './alertsApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('alertsApiClient', () => {
  let fakeAlertsApiClient: nock.Scope
  let alertsApiClient: AlertsApiClient

  beforeEach(() => {
    fakeAlertsApiClient = nock(config.apis.alertsApi.url)
    alertsApiClient = new AlertsApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getAlertsGlobal', () => {
    it('should query the API for alerts', async () => {
      const response = { data: 'data' }
      const offenderNumbers = ['A1234', 'B4321']

      fakeAlertsApiClient
        .post('/search/alerts/prison-numbers', offenderNumbers)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await alertsApiClient.getAlertsGlobal(accessToken, offenderNumbers)
      expect(output).toEqual(response)
    })
  })
})
