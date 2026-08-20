import nock from 'nock'
import config from '../config'
import PrisonRegisterApiClient, { Prison } from './prisonRegisterApiClient'

const accessToken = 'token-1'

describe('prisonRegisterApiClient', () => {
  let fakeApi: nock.Scope
  let client: PrisonRegisterApiClient

  beforeEach(() => {
    fakeApi = nock(config.apis.prisonRegisterApi.url)
    client = new PrisonRegisterApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisonById', () => {
    it('should query the register for the prison', async () => {
      const prison: Prison = { prisonId: 'MDI', prisonName: 'Moorland (HMP & YOI)', active: true }

      fakeApi.get('/prisons/id/MDI').matchHeader('authorization', `Bearer ${accessToken}`).reply(200, prison)

      const output = await client.getPrisonById(accessToken, 'MDI')
      expect(output).toEqual(prison)
    })
  })
})
