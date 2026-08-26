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

  describe('getMainOffence', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/bookings/456/mainOffence')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getMainOffence(accessToken, 456)
      expect(output).toEqual(response)
    })
  })

  describe('getHistoryByDate', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/cell/BXI/history/2024-01-01')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getHistoryByDate(accessToken, 'BXI', '2024-01-01')
      expect(output).toEqual(response)
    })
  })

  describe('getStaffDetails', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/users/SGAMGEE_GEN')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getStaffDetails(accessToken, 'SGAMGEE_GEN')
      expect(output).toEqual(response)
    })
  })

  describe('getOffenderCellHistory', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/bookings/1234/cell-history')
        .query({ page: 0, size: 20 })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getOffenderCellHistory(accessToken, 1234)
      expect(output).toEqual(response)
    })
  })
})
