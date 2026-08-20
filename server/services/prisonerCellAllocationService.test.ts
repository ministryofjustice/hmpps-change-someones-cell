import {
  LocationsInsidePrisonApiClient,
  PrisonApiClient,
  CellMovementsApiClient,
  AlertsApiClient,
  PrisonerSearchApiClient,
} from '../data'
import { BedAssignment, Offender, Page, ReferenceCode } from '../data/prisonApiClient'
import { CellMovement } from '../data/cellMovementsApiClient'
import PrisonerCellAllocationService from './prisonerCellAllocationService'
import { CellLocation, Location, Occupant, getActualCapacity } from '../data/locationsInsidePrisonApiClient'
import { Prisoner } from '../data/prisonerSearchApiClient'

jest.mock('../data/alertsApiClient')
jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')
jest.mock('../data/cellMovementsApiClient')
jest.mock('../data/locationsInsidePrisonApiClient')

const token = 'some token'

// Mocking the locations module stubs out its `getActualCapacity` helper along with the client,
// which would silently make every capacity undefined. The capacity rule is what these tests are
// about, so keep the real one.
const { getActualCapacity: realGetActualCapacity } = jest.requireActual('../data/locationsInsidePrisonApiClient')

describe('Prisoner cell allocation service', () => {
  let alertsApiClient: jest.Mocked<AlertsApiClient>
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let cellMovementsApiClient: jest.Mocked<CellMovementsApiClient>
  let prisonerCellAllocationService: PrisonerCellAllocationService
  let locationsInsidePrisonApiClient: jest.Mocked<LocationsInsidePrisonApiClient>
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  beforeEach(() => {
    jest.mocked(getActualCapacity).mockImplementation(realGetActualCapacity)
    alertsApiClient = new AlertsApiClient() as jest.Mocked<AlertsApiClient>
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    cellMovementsApiClient = new CellMovementsApiClient() as jest.Mocked<CellMovementsApiClient>
    locationsInsidePrisonApiClient = new LocationsInsidePrisonApiClient() as jest.Mocked<LocationsInsidePrisonApiClient>
    prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
    prisonerCellAllocationService = new PrisonerCellAllocationService(
      alertsApiClient,
      prisonApiClient,
      cellMovementsApiClient,
      locationsInsidePrisonApiClient,
      prisonerSearchApiClient,
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
    const locationsApiCells: CellLocation[] = [{ ...cell, id: '01909bc6-c0f6-75b2-af0f-ffb935211faf' }]

    it('calls Prison API when searching for ALL', async () => {
      locationsInsidePrisonApiClient.getCellsWithCapacity.mockResolvedValue(prisonApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'ALL')

      expect(locationsInsidePrisonApiClient.getCellsWithCapacity).toHaveBeenCalledWith(token, 'LEI')
      expect(result[0].id).toEqual(prisonApiCells[0].id)
    })

    it('calls the locations API when not searching for ALL', async () => {
      locationsInsidePrisonApiClient.getCellsWithCapacity.mockResolvedValue(locationsApiCells)

      const result = await prisonerCellAllocationService.getCellsWithCapacity(token, 'LEI', 'location', 'subLocation')

      expect(locationsInsidePrisonApiClient.getCellsWithCapacity).toHaveBeenCalledWith(
        token,
        'LEI',
        'location_subLocation',
      )
      expect(result[0].id).toEqual(locationsApiCells[0].id)
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
    const cellMovement: CellMovement = {
      id: 'e19a2b16-6b7b-4a3e-9f1a-2d8e5c4f3a21',
      movementType: 'CELL_MOVE',
      prisonerNumber: 'AB1000C',
      fromLocationKey: 'BXI-1-1-300',
      toLocationKey: 'BXI-1-1-400',
      reasonCode: 'blah',
      occurredAt: '2026-08-19T10:00:00',
      recordedBy: 'A_USER',
      status: 'COMPLETED',
    }

    it('performs the cell move via the cell movements API', async () => {
      cellMovementsApiClient.moveToCell.mockResolvedValue(cellMovement)
      const result = await prisonerCellAllocationService.moveToCell(token, 'AB1000C', 'BXI-1-1-400', 'blah', 'yup')

      expect(cellMovementsApiClient.moveToCell).toHaveBeenCalledWith(token, 'AB1000C', 'BXI-1-1-400', 'blah', 'yup')
      expect(result).toEqual(cellMovement)
    })

    it('propagates error', async () => {
      cellMovementsApiClient.moveToCell.mockRejectedValue(new Error('some error'))

      await expect(
        prisonerCellAllocationService.moveToCell(token, 'AB1000C', 'BXI-1-1-400', 'blah', 'yup'),
      ).rejects.toEqual(new Error('some error'))
    })
  })

  describe('moveToCellSwap', () => {
    const cellSwap: CellMovement = {
      id: '7c1e2f3a-1111-4d4d-8888-aaaaaaaaaaaa',
      movementType: 'CELL_SWAP',
      prisonerNumber: 'A1234BC',
      fromLocationKey: 'MDI-1-1-001',
      toLocationKey: 'MDI-CSWAP',
      reasonCode: 'ADM',
      occurredAt: '2026-08-19T10:00:00',
      recordedBy: 'A_USER',
      status: 'COMPLETED',
    }

    it('performs the cell swap via the cell movements API', async () => {
      cellMovementsApiClient.moveToCellSwap.mockResolvedValue(cellSwap)
      const result = await prisonerCellAllocationService.moveToCellSwap(token, 'A1234BC')

      expect(cellMovementsApiClient.moveToCellSwap).toHaveBeenCalledWith(token, 'A1234BC')
      expect(result).toEqual(cellSwap)
    })

    it('propagates error', async () => {
      cellMovementsApiClient.moveToCellSwap.mockRejectedValue(new Error('some error'))

      await expect(prisonerCellAllocationService.moveToCellSwap(token, 'A1234BC')).rejects.toEqual(
        new Error('some error'),
      )
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

  describe('reception', () => {
    // The real MDI-RECP shape: workingCapacity 0 must fall through to maxCapacity, or reception
    // would read as permanently full.
    const receptionLocation = {
      prisonId: 'LEI',
      key: 'LEI-RECP',
      pathHierarchy: 'RECP',
      capacity: { maxCapacity: 99, workingCapacity: 0 },
    } as Location

    const prisonerInReception = (prisonerNumber: string, cellLocation = 'RECP') =>
      ({
        prisonerNumber,
        firstName: 'Garry',
        lastName: 'Kasparov',
        cellLocation,
      }) as Prisoner

    describe('getReceptionCapacity', () => {
      it('reports space when occupants are below the actual capacity', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([prisonerInReception('G3878UK')])

        const result = await prisonerCellAllocationService.getReceptionCapacity(token, 'LEI')

        expect(result).toEqual({ locationKey: 'LEI-RECP', capacity: 99, occupants: 1, hasSpace: true })
        expect(locationsInsidePrisonApiClient.getLocation).toHaveBeenCalledWith(token, 'LEI-RECP')
        expect(prisonerSearchApiClient.findPrisonersInCellLocations).toHaveBeenCalledWith(token, 'LEI', ['RECP'])
      })

      it('reports no space when reception is exactly full', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue({
          ...receptionLocation,
          capacity: { maxCapacity: 2, workingCapacity: 0 },
        } as Location)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([
          prisonerInReception('G3878UK'),
          prisonerInReception('A1234BC'),
        ])

        const result = await prisonerCellAllocationService.getReceptionCapacity(token, 'LEI')

        expect(result).toEqual({ locationKey: 'LEI-RECP', capacity: 2, occupants: 2, hasSpace: false })
      })

      it('prefers working capacity when it is set', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue({
          ...receptionLocation,
          capacity: { maxCapacity: 99, workingCapacity: 1 },
        } as Location)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([prisonerInReception('G3878UK')])

        const result = await prisonerCellAllocationService.getReceptionCapacity(token, 'LEI')

        expect(result).toEqual({ locationKey: 'LEI-RECP', capacity: 1, occupants: 1, hasSpace: false })
      })

      // A prison with no reception used to surface as prison-api's empty list, i.e. "no space".
      it('reports no space when the prison has no reception location', async () => {
        locationsInsidePrisonApiClient.getLocation.mockRejectedValue({ status: 404 })
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([])

        const result = await prisonerCellAllocationService.getReceptionCapacity(token, 'LEI')

        expect(result).toEqual({ locationKey: 'LEI-RECP', capacity: 0, occupants: 0, hasSpace: false })
      })

      it('propagates errors other than a missing reception', async () => {
        locationsInsidePrisonApiClient.getLocation.mockRejectedValue(new Error('some error'))
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([])

        await expect(prisonerCellAllocationService.getReceptionCapacity(token, 'LEI')).rejects.toEqual(
          new Error('some error'),
        )
      })
    })

    describe('getReceptionOccupancy', () => {
      it('returns those in reception with their active alert codes', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([prisonerInReception('G3878UK')])
        alertsApiClient.getAlertsGlobal.mockResolvedValue({
          content: [{ isActive: true, prisonNumber: 'G3878UK', alertCode: { code: 'XGANG' } }],
        })

        const result = await prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')

        expect(result.offenders).toEqual([
          { offenderNo: 'G3878UK', firstName: 'Garry', lastName: 'Kasparov', alerts: ['XGANG'] },
        ])
      })

      // prison-api matched every virtual location, not just RECP, so the roll must too.
      it('searches the whole virtual location set for the roll', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([])

        await prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')

        expect(prisonerSearchApiClient.findPrisonersInCellLocations).toHaveBeenCalledWith(token, 'LEI', [
          'RECP',
          'COURT',
          'TAP',
        ])
      })

      // Capacity is a RECP-only question, so those at COURT or on TAP must not count against it.
      it('counts only RECP towards capacity, from the single search', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue({
          ...receptionLocation,
          capacity: { maxCapacity: 2, workingCapacity: 0 },
        } as Location)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([
          prisonerInReception('G3878UK', 'RECP'),
          prisonerInReception('A1234BC', 'COURT'),
          prisonerInReception('B1234CD', 'TAP'),
        ])
        alertsApiClient.getAlertsGlobal.mockResolvedValue({ content: [] })

        const result = await prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')

        expect(result.occupants).toEqual(1)
        expect(result.hasSpace).toEqual(true)
        expect(result.offenders).toHaveLength(3)
        expect(prisonerSearchApiClient.findPrisonersInCellLocations).toHaveBeenCalledTimes(1)
      })

      it('defaults alerts to an empty list when none are returned', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([prisonerInReception('G3878UK')])
        alertsApiClient.getAlertsGlobal.mockResolvedValue(undefined)

        const result = await prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')

        expect(result.offenders[0].alerts).toEqual([])
      })

      it('does not call for alerts when reception is empty', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockResolvedValue([])

        const result = await prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')

        expect(result.offenders).toEqual([])
        expect(alertsApiClient.getAlertsGlobal).not.toHaveBeenCalled()
      })

      it('propagates error', async () => {
        locationsInsidePrisonApiClient.getLocation.mockResolvedValue(receptionLocation)
        prisonerSearchApiClient.findPrisonersInCellLocations.mockRejectedValue(new Error('some error'))

        await expect(prisonerCellAllocationService.getReceptionOccupancy(token, 'LEI')).rejects.toEqual(
          new Error('some error'),
        )
      })
    })
  })
})
