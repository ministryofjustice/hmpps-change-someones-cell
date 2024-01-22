import { Readable } from 'stream'
import { PrisonApiClient } from '../data'
import PrisonerDetailsService from './prisonerDetailsService'
import { OffenderDetails } from '../data/prisonApiClient'

jest.mock('../data/prisonApiClient')

const token = 'some token'

describe('Prisoner details service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerDetailsService: PrisonerDetailsService

  describe('getImage', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

    it('uses prison api to request image data', async () => {
      prisonApiClient.getImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getImage(token, '1234')

      expect(prisonApiClient.getImage).toHaveBeenCalledWith(token, '1234')
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getPrisonerImage', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

    it('uses prison api to request image data', async () => {
      prisonApiClient.getPrisonerImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getPrisonerImage(token, 'A1234BC', true)

      expect(prisonApiClient.getPrisonerImage).toHaveBeenCalledWith(token, 'A1234BC', true)
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getDetails', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

    const details: OffenderDetails = {
      bookingId: 1234,
      offenderNo: 'A1234',
      firstName: 'Test',
      lastName: 'User',
      csraClassificationCode: 'HI',
      agencyId: 'MDI',
      assignedLivingUnit: {
        agencyId: 'BXI',
        locationId: 5432,
        description: '1-1-001',
        agencyName: 'Brixton (HMP)',
      },
      alerts: [],
      dateOfBirth: '1990-10-12',
      age: 29,
      assignedLivingUnitId: 5432,
      assignedLivingUnitDesc: '1-1-001',
      categoryCode: 'C',
      alertsDetails: ['XA', 'XVL'],
      alertsCodes: ['XA', 'XVL'],
    }

    it('retrieves prisoner details', async () => {
      prisonApiClient.getDetails.mockResolvedValue(details)

      const results = await prisonerDetailsService.getDetails(token, 'A1234', true)

      expect(prisonApiClient.getDetails).toHaveBeenCalledWith(token, 'A1234', true)
      expect(results).toEqual(details)
    })

    it('propagates error', async () => {
      prisonApiClient.getDetails.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getDetails(token, 'A1234', true)).rejects.toEqual(new Error('some error'))
    })
  })
})
