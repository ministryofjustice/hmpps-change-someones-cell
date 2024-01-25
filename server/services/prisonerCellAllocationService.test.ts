import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Offender, OffenderCell } from '../data/prisonApiClient'
import PrisonerCellAllocationService from './prisonerCellAllocationService'

jest.mock('../data/prisonApiClient')
jest.mock('../data/whereaboutsApiClient')

const token = 'some token'

describe('Prisoner cell allocation service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let whereaboutsApiClient: jest.Mocked<WhereaboutsApiClient>
  let prisonerCellAllocationService: PrisonerCellAllocationService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
    prisonerCellAllocationService = new PrisonerCellAllocationService(prisonApiClient, whereaboutsApiClient)
  })

  describe('getInmates', () => {
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

    it('Retrieves inmates', async () => {
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

  describe('getInmatesAtLocation', () => {
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

    it('Retrieves inmates at location', async () => {
      prisonApiClient.getInmatesAtLocation.mockResolvedValue(offenders)

      const result = await prisonerCellAllocationService.getInmatesAtLocation(token, 4231)

      expect(result[0].offenderNo).toEqual('A1234BC')
    })

    it('Propagates error', async () => {
      prisonApiClient.getInmatesAtLocation.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getInmatesAtLocation(token, 4231)).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getCellsWithCapacity', () => {
    const cell: OffenderCell = {
      id: 1,
      description: 'LEI-1-1',
      userDescription: 'LEI-1-1',
      capacity: 2,
      noOfOccupants: 2,
      attributes: [
        {
          code: 'LC',
          description: 'Listener Cell',
        },
      ],
    }

    const prisonApiCells = [cell]
    const whereaboutsApiCells = [{ ...cell, id: 2 }]

    it('calls Prison API when searching for ALL', async () => {
      prisonApiClient.getCellsWithCapacity.mockResolvedValue(prisonApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'ALL')

      expect(prisonApiClient.getCellsWithCapacity).toHaveBeenCalledWith(token, 'LEI')
      expect(result[0].id).toEqual(1)
    })

    it('calls Whereabouts API when not searching for ALL', async () => {
      whereaboutsApiClient.getCellsWithCapacity.mockResolvedValue(whereaboutsApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'location', 'subLocation')

      expect(whereaboutsApiClient.getCellsWithCapacity).toHaveBeenCalledWith(token, 'LEI', 'location_subLocation')
      expect(result[0].id).toEqual(2)
    })

    it('Propagates error', async () => {
      prisonApiClient.getCellsWithCapacity.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'ALL')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })
})
