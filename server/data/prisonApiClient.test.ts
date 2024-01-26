import nock from 'nock'

import config from '../config'
import PrisonApiClient from './prisonApiClient'

jest.mock('./tokenStore')

const accessToken = 'token-1'

describe('prisonApiClient', () => {
  let fakePrisonApiClient: nock.Scope
  let prisonApiClient: PrisonApiClient

  beforeEach(() => {
    fakePrisonApiClient = nock(config.apis.prisonApi.url)
    prisonApiClient = new PrisonApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getInmates', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/locations/description/BXI/inmates')
        .query({ keywords: 'Smith', returnAlerts: 'true' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .matchHeader('Page-Limit', '5000')
        .matchHeader('Sort-Fields', 'lastName,firstName')
        .matchHeader('Sort-Order', 'ASC')
        .reply(200, response)

      const output = await prisonApiClient.getInmates(accessToken, 'BXI', 'Smith', true)
      expect(output).toEqual(response)
    })
  })

  describe('getInmatesAtLocation', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/locations/4231/inmates')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getInmatesAtLocation(accessToken, 4231)
      expect(output).toEqual(response)
    })
  })

  describe('userCaseLoads', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/users/me/caseLoads')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.userCaseLoads(accessToken)
      expect(output).toEqual(response)
    })
  })

  describe('getImage', () => {
    it('should return image data from api', async () => {
      fakePrisonApiClient
        .get('/api/images/1234/data')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, 'image data', { 'Content-Type': 'image/jpeg' })

      const response = await prisonApiClient.getImage(accessToken, '1234')

      expect(response.read()).toEqual(Buffer.from('image data'))
    })
  })

  describe('getPrisonerImage', () => {
    it('should return image data from api', async () => {
      fakePrisonApiClient
        .get('/api/bookings/offenderNo/A1234AA/image/data')
        .query({ fullSizeImage: 'true' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, 'image data', { 'Content-Type': 'image/jpeg' })

      const response = await prisonApiClient.getPrisonerImage(accessToken, 'A1234AA', true)

      expect(response.read()).toEqual(Buffer.from('image data'))
    })
  })

  describe('setActiveCaseload', () => {
    it('should send the caseload to the api', async () => {
      const response = { data: 'data' }
      const caseload = {
        caseLoadId: 'BXI',
        description: 'Brixton (HMP)',
        currentlyActive: true,
      }

      fakePrisonApiClient
        .put('/api/users/me/activeCaseLoad', caseload)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.setActiveCaseload(accessToken, caseload)
      expect(output).toEqual(response)
    })
  })

  describe('getDetails', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/bookings/offenderNo/A1234?fullInfo=true&csraSummary=true')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getDetails(accessToken, 'A1234', true)
      expect(output).toEqual(response)
    })
  })

  describe('getAlerts', () => {
    it('should query the API for alerts', async () => {
      const response = { data: 'data' }
      const offenderNumbers = ['A1234', 'B4321']

      fakePrisonApiClient
        .post('/api/bookings/offenderNo/BXI/alerts', offenderNumbers)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getAlerts(accessToken, 'BXI', offenderNumbers)
      expect(output).toEqual(response)
    })
  })

  describe('getCsraAssessments', () => {
    it('should query the API for alerts', async () => {
      const response = { data: 'data' }
      const offenderNumbers = ['A1234', 'B4321']

      fakePrisonApiClient
        .post('/api/offender-assessments/csra/list', offenderNumbers)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getCsraAssessments(accessToken, offenderNumbers)
      expect(output).toEqual(response)
    })
  })

  describe('getLocation', () => {
    it('should return a location from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/locations/123')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getLocation(accessToken, 123)
      expect(output).toEqual(response)
    })
  })

  describe('getCellsWithCapacity', () => {
    it('should return available cells from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/agencies/BXI/cellsWithCapacity')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getCellsWithCapacity(accessToken, 'BXI')
      expect(output).toEqual(response)
    })
  })
})
