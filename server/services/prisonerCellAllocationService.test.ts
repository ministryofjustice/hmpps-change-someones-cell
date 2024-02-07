import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { BedAssignment, Offender, OffenderCell, OffenderDetails, Page, ReferenceCode } from '../data/prisonApiClient'
import { CellMoveResponse } from '../data/whereaboutsApiClient'
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

  describe('getCellMoveReasonTypes', () => {
    const reasonCodes: ReferenceCode[] = [
      {
        domain: 'CHG_HOUS_RSN',
        code: 'ADM',
        description: 'Administrative',
        activeFlag: 'N',
        listSeq: 1,
        systemDataFlag: 'N',
        subCodes: [],
      },
    ]

    it('Retrieves cell move reasons reference data', async () => {
      prisonApiClient.getCellMoveReasonTypes.mockResolvedValue(reasonCodes)

      const result = await prisonerCellAllocationService.getCellMoveReasonTypes(token)

      expect(result).toEqual(reasonCodes)
    })

    it('Propagates error', async () => {
      prisonApiClient.getCellMoveReasonTypes.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getCellMoveReasonTypes(token)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('moveToCell', () => {
    const cellMoveResponse: CellMoveResponse = {
      cellMoveResult: {
        bookingId: 300,
        agencyId: 'BXI',
        assignedLivingUnitId: 400,
        assignedLivingUnitDesc: '1-1-400',
        bedAssignmentHistorySequence: 0,
        caseNoteId: 0,
      },
    }

    it('performs cell move via Whereabouts API', async () => {
      whereaboutsApiClient.moveToCell.mockResolvedValue(cellMoveResponse)
      const result = await prisonerCellAllocationService.moveToCell(token, 300, 'AB1000C', '1-1-400', 'blah', 'yup')

      expect(whereaboutsApiClient.moveToCell).toHaveBeenCalledWith(token, 300, 'AB1000C', '1-1-400', 'blah', 'yup')
      expect(result).toEqual(cellMoveResponse)
    })

    it('propagates error', async () => {
      whereaboutsApiClient.moveToCell.mockRejectedValue(new Error('some error'))

      await expect(
        prisonerCellAllocationService.moveToCell(token, 300, 'AB1000C', '1-1-400', 'blah', 'yup'),
      ).rejects.toEqual(new Error('some error'))
    })
  })

  describe('moveToCellSwap', () => {
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
      assessments: [],
    }

    it('performs cell move via Prison API', async () => {
      prisonApiClient.moveToCellSwap.mockResolvedValue(details)
      const result = await prisonerCellAllocationService.moveToCellSwap(token, 1234)

      expect(prisonApiClient.moveToCellSwap).toHaveBeenCalledWith(token, 1234)
      expect(result).toEqual(details)
    })

    it('propagates error', async () => {
      prisonApiClient.moveToCellSwap.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.moveToCellSwap(token, 1234)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getHistoryByDate', () => {
    const history: BedAssignment[] = [
      {
        bookingId: 1234134,
        livingUnitId: 123123,
        assignmentDate: '2020-10-12',
        assignmentDateTime: '2021-07-05T10:35:17',
        assignmentReason: 'ADM',
        assignmentEndDate: '2020-11-12',
        assignmentEndDateTime: '2021-07-05T10:35:17',
        agencyId: 'MDI',
        description: 'MDI-1-1-2',
        bedAssignmentHistorySequence: 2,
        movementMadeBy: 'KQJ74F',
        offenderNo: 'A1234AA',
      },
    ]

    it('Retrieves cell move reasons reference data', async () => {
      prisonApiClient.getHistoryByDate.mockResolvedValue(history)

      const result = await prisonerCellAllocationService.getHistoryByDate(token, 'BXI', '2024-01-01')

      expect(result).toEqual(history)
    })

    it('Propagates error', async () => {
      prisonApiClient.getHistoryByDate.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getHistoryByDate(token, 'BXI', '2024-01-01')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getOffenderCellHistory', () => {
    const results: Page<BedAssignment> = {
      totalPages: 1,
      totalElements: 1,
      first: true,
      last: true,
      size: 1,
      content: [
        {
          bookingId: 1234134,
          livingUnitId: 123123,
          assignmentDate: '2020-10-12',
          assignmentDateTime: '2021-07-05T10:35:17',
          assignmentReason: 'ADM',
          assignmentEndDate: '2020-11-12',
          assignmentEndDateTime: '2021-07-05T10:35:17',
          agencyId: 'MDI',
          description: 'MDI-1-1-2',
          bedAssignmentHistorySequence: 2,
          movementMadeBy: 'KQJ74F',
          offenderNo: 'A1234AA',
        },
      ],
      number: 1,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      numberOfElements: 1,
      pageable: {
        offset: 0,
        sort: {
          empty: false,
          sorted: true,
          unsorted: false,
        },
        pageSize: 0,
        pageNumber: 0,
        paged: true,
        unpaged: false,
      },
      empty: false,
    }

    it('Retrieves cell move reasons reference data', async () => {
      prisonApiClient.getOffenderCellHistory.mockResolvedValue(results)

      const result = await prisonerCellAllocationService.getOffenderCellHistory(token, 1234)

      expect(result).toEqual(results)
    })

    it('Propagates error', async () => {
      prisonApiClient.getOffenderCellHistory.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getOffenderCellHistory(token, 1234)).rejects.toEqual(
        new Error('some error'),
      )
    })
  })
})
