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
    it('should return inmates', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/locations/description/BXI/inmates')
        .query({ returnAlerts: 'true' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .matchHeader('Page-Limit', '5000')
        .matchHeader('Sort-Fields', 'lastName,firstName')
        .matchHeader('Sort-Order', 'ASC')
        .reply(200, response)

      const output = await prisonApiClient.getInmates(accessToken, 'BXI', null, true)
      expect(output).toEqual(response)
    })

    it('should search for inmates by name', async () => {
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

  describe('getCellMoveReasonTypes', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/reference-domains/domains/CHG_HOUS_RSN')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .matchHeader('Page-Limit', '1000')
        .reply(200, response)

      const output = await prisonApiClient.getCellMoveReasonTypes(accessToken)
      expect(output).toEqual(response)
    })
  })

  describe('moveToCellSwap', () => {
    it('should request the move to cell swap', async () => {
      const response = { data: 'data' }
      const bookingId = 432

      fakePrisonApiClient
        .put(`/api/bookings/${bookingId}/move-to-cell-swap`, {})
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.moveToCellSwap(accessToken, bookingId)
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

  describe('getAgencyDetails', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/agencies/BXI?activeOnly=false')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getAgencyDetails(accessToken, 'BXI')
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

  describe('getPrisoners', () => {
    it('should search for prisoners', async () => {
      const response = { data: 'data' }
      const offenderNos = ['A1234BC', 'B4321CD']
      const searchCriteria = { offenderNos }

      fakePrisonApiClient
        .post('/api/prisoners', searchCriteria)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .matchHeader('Page-Offset', '0')
        .matchHeader('Page-Limit', '2')
        .reply(200, response)

      const output = await prisonApiClient.getPrisoners(accessToken, offenderNos)
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

  describe('getReceptionsWithCapacity', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/agencies/BXI/receptionsWithCapacity')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getReceptionsWithCapacity(accessToken, 'BXI')
      expect(output).toEqual(response)
    })
  })

  describe('getOffendersInReception', () => {
    it('should return data from api', async () => {
      const response = { data: 'data' }

      fakePrisonApiClient
        .get('/api/movements/rollcount/BXI/in-reception')
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getOffendersInReception(accessToken, 'BXI')
      expect(output).toEqual(response)
    })
  })

  describe('getAlertsGlobal', () => {
    it('should query the API for alerts', async () => {
      const response = { data: 'data' }
      const offenderNumbers = ['A1234', 'B4321']

      fakePrisonApiClient
        .post('/api/bookings/offenderNo/alerts', offenderNumbers)
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(200, response)

      const output = await prisonApiClient.getAlertsGlobal(accessToken, offenderNumbers)
      expect(output).toEqual(response)
    })
  })
})
