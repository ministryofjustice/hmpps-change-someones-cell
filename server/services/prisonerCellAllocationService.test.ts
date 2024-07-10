import { LocationsInsidePrisonApiClient, PrisonApiClient, PrisonerSearchApiClient, WhereaboutsApiClient } from '../data'
import {
  BedAssignment,
  Offender,
  OffenderCell,
  OffenderDetails,
  OffenderInReception,
  Page,
  ReferenceCode,
} from '../data/prisonApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'
import { CellMoveResponse } from '../data/whereaboutsApiClient'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import { CellLocation, Occupant } from '../data/locationsInsidePrisonApiClient'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/whereaboutsApiClient')
jest.mock('../data/locationsInsidePrisonApiClient')

const token = 'some token'

describe('Prisoner cell allocation service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  let whereaboutsApiClient: jest.Mocked<WhereaboutsApiClient>
  let prisonerCellAllocationService: PrisonerCellAllocationService
  let locationsInsidePrisonApiClient: jest.Mocked<LocationsInsidePrisonApiClient>
  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
    whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
    locationsInsidePrisonApiClient = new LocationsInsidePrisonApiClient() as jest.Mocked<LocationsInsidePrisonApiClient>
    prisonerCellAllocationService = new PrisonerCellAllocationService(
      prisonApiClient,
      whereaboutsApiClient,
      prisonerSearchApiClient,
      locationsInsidePrisonApiClient,
    )
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

  describe('getPrisonersAtLocations', () => {
    const prisoners: Prisoner[] = [
      {
        bookingId: 1,
        prisonerNumber: 'A1234BC',
        firstName: 'JOHN',
        lastName: 'SMITH',
        prisonId: 'MDI',
        prisonName: 'Moorland',
        category: 'C',
        gender: 'Male',
        mostSeriousOffence: 'Robbery',
        alerts: [
          {
            active: true,
            alertCode: 'HA',
            alertType: 'H',
            expired: false,
          },
        ],
      },
    ]

    const pagedResult = {
      totalPages: 1,
      totalElements: 1,
      first: true,
      last: true,
      size: 1,
      content: prisoners,
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

    it('Retrieves inmates at location', async () => {
      prisonerSearchApiClient.getPrisonersAtLocations.mockResolvedValue(pagedResult)

      const result = await prisonerCellAllocationService.getPrisonersAtLocations(token, 'MDI', ['A-1-001', 'A-1-002'])

      expect(result[0].prisonerNumber).toEqual('A1234BC')
    })

    it('Propagates error', async () => {
      prisonerSearchApiClient.getPrisonersAtLocations.mockRejectedValue(new Error('some error'))

      await expect(
        prisonerCellAllocationService.getPrisonersAtLocations(token, 'MDI', ['A-1-001', 'A-1-002']),
      ).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getInmatesAtLocation', () => {
    const occupants: Occupant[] = [
      {
        cellLocation: 'ABC-1-1-5',
        prisoners: [
          {
            prisonerNumber: 'A1234AA',
            firstName: 'Dave',
            lastName: 'Jones',
            prisonId: 'LEI',
            prisonName: 'HMP Leeds',
            cellLocation: '1-1-5',
          },
        ],
      },
    ]

    it('retrieves inmates at location', async () => {
      locationsInsidePrisonApiClient.getInmatesAtLocation.mockResolvedValue(occupants)

      const results = await prisonerCellAllocationService.getInmatesAtLocation(token, 'ABC-1-1-5')

      expect(results).toEqual(occupants)
    })

    it('Propagates error', async () => {
      locationsInsidePrisonApiClient.getInmatesAtLocation.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getInmatesAtLocation(token, 'ABC-1-1-5')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getCellsWithCapacity', () => {
    const cell: CellLocation = {
      id: '01909bbe-7ed4-782c-9d86-50f3d40ba204',
      key: 'LEI-1-1',
      pathHierarchy: '1-1',
      localName: 'LEI-1-1',
      prisonId: 'LEI',
      workingCapacity: 2,
      maxCapacity: 2,
      noOfOccupants: 1,
      legacyAttributes: [
        {
          typeCode: 'LC',
          typeDescription: 'Listener Cell',
        },
      ],
      specialistCellTypes: [
        {
          typeCode: 'CAT_A',
          typeDescription: 'Category A Cell',
        },
      ],
      prisonersInCell: [
        {
          bookingId: 1,
          prisonerNumber: 'A1234BC',
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonId: 'MDI',
          prisonName: 'Moorland',
          category: 'C',
          gender: 'Male',
          mostSeriousOffence: 'Robbery',
          alerts: [
            {
              active: true,
              alertCode: 'HA',
              alertType: 'H',
              expired: false,
            },
          ],
        },
      ],
    }

    const prisonApiCells: CellLocation[] = [cell]
    const whereaboutsApiCells: CellLocation[] = [{ ...cell, id: '01909bc6-c0f6-75b2-af0f-ffb935211faf' }]

    it('calls Prison API when searching for ALL', async () => {
      locationsInsidePrisonApiClient.getCellsWithCapacity.mockResolvedValue(prisonApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'ALL')

      expect(locationsInsidePrisonApiClient.getCellsWithCapacity).toHaveBeenCalledWith(token, 'LEI')
      expect(result[0].id).toEqual(prisonApiCells[0].id)
    })

    it('calls Whereabouts API when not searching for ALL', async () => {
      locationsInsidePrisonApiClient.getCellsWithCapacity.mockResolvedValue(whereaboutsApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'location', 'subLocation')

      expect(locationsInsidePrisonApiClient.getCellsWithCapacity).toHaveBeenCalledWith(
        token,
        'LEI',
        'location_subLocation',
      )
      expect(result[0].id).toEqual(whereaboutsApiCells[0].id)
    })

    it('Propagates error', async () => {
      locationsInsidePrisonApiClient.getCellsWithCapacity.mockRejectedValue(new Error('some error'))

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

  describe('getReceptionsWithCapacity', () => {
    const cells: OffenderCell[] = [
      {
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
      },
    ]

    it('retrieves receptions with available capacity', async () => {
      prisonApiClient.getReceptionsWithCapacity.mockResolvedValue(cells)

      const result = await prisonerCellAllocationService.getReceptionsWithCapacity(token, 'LEI')

      expect(result).toEqual(cells)
    })

    it('Propagates error', async () => {
      prisonApiClient.getReceptionsWithCapacity.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getReceptionsWithCapacity(token, 'LEI')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getOffendersInReception', () => {
    const offender: OffenderInReception = {
      offenderNo: 'G3878UK',
      bookingId: 1234,
      dateOfBirth: '1990-02-12',
      firstName: 'Garry',
      lastName: 'Kasparov',
    }

    it('retrieves offenders in reception with alerts', async () => {
      prisonApiClient.getOffendersInReception.mockResolvedValue([offender])
      prisonApiClient.getAlertsGlobal.mockResolvedValue([
        {
          active: true,
          addedByFirstName: 'John',
          addedByLastName: 'Smith',
          alertCode: 'XGANG',
          alertCodeDescription: 'Gang member',
          alertId: 1,
          alertType: 'X',
          alertTypeDescription: 'Security',
          bookingId: 14,
          comment: 'silly',
          dateCreated: '2019-08-25',
          dateExpires: '2019-09-20',
          expired: false,
          expiredByFirstName: 'Jane',
          expiredByLastName: 'Smith',
          modifiedDateTime: '2021-07-05T10:35:17',
          offenderNo: 'G3878UK',
        },
      ])

      const result = await prisonerCellAllocationService.getOffendersInReception(token, 'LEI')

      expect(result).toEqual([{ ...offender, alerts: ['XGANG'] }])
    })

    it('Propagates error', async () => {
      prisonApiClient.getOffendersInReception.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.getOffendersInReception(token, 'LEI')).rejects.toEqual(
        new Error('some error'),
      )
    })
    it('Does not call to get offender alerts if none in reception', async () => {
      prisonApiClient.getOffendersInReception.mockResolvedValue([])
      await prisonerCellAllocationService.getOffendersInReception(token, 'LEI')
      expect(prisonApiClient.getAlertsGlobal).not.toHaveBeenCalled()
    })
  })
})
