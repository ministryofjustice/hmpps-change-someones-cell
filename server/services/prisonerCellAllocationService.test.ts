import { HmppsAuthClient, PrisonApiClient } from '../data'
import { Offender } from '../data/prisonApiClient'
import PrisonerCellAllocationService from './prisonerCellAllocationService'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/prisonApiClient')

const token = 'some token'

describe('Prisoner cell allocation service', () => {
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerCellAllocationService: PrisonerCellAllocationService

  describe('getInmates', () => {
    beforeEach(() => {
      hmppsAuthClient = new HmppsAuthClient(undefined) as jest.Mocked<HmppsAuthClient>
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerCellAllocationService = new PrisonerCellAllocationService(prisonApiClient, hmppsAuthClient)
    })

    const offenders: Offender[] = [
      {
        bookingId: 1,
        offenderNo: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        dateOfBirth: '1990-10-12',
        age: 29,
        agencyId: 'MDI',
        assignedLivingUnitId: 1,
        assignedLivingUnitDesc: 'UNIT-1',
        categoryCode: 'C',
        alertsDetails: ['XA', 'XVL'],
        alertsCodes: ['XA', 'XVL'],
      },
    ]

    it('Retrieves and formats user name', async () => {
      prisonApiClient.getInmates.mockResolvedValue(offenders)

      const result = await prisonerCellAllocationService.getInmates(token, 'BXI', 'Smith', true)

      expect(result[0].offenderNo).toEqual('A1234BC')
    })

    it('Propagates error', async () => {
      prisonApiClient.getInmates.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getInmates(token, 'BXI', 'Smith', true)).rejects.toEqual(
        new Error('some error'),
      )
    })
  })
})
