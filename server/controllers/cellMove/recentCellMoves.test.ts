import recentCellMovesFactory from './recentCellMoves'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

jest.mock('../../services/prisonerCellAllocationService')

const dataSets = {
  '2020-02-01': [
    {
      bookingId: -34,
      livingUnitId: -16,
      assignmentDate: '2020-02-01',
      assignmentDateTime: '2019-10-17T11:00:00',
      assignmentReason: 'ADM',
      assignmentEndDate: '2020-01-01',
      assignmentEndDateTime: '2020-01-01T11:00:00',
      agencyId: 'LEI',
      description: 'LEI-H-1-2',
      bedAssignmentHistorySequence: 2,
      movementMadeBy: 'SA',
    },
  ],
  '2020-02-03': [
    {
      bookingId: -34,
      livingUnitId: -16,
      assignmentDate: '2020-02-03',
      assignmentDateTime: '2020-02-03T11:00:00',
      assignmentReason: 'ADM',
      agencyId: 'LEI',
      description: 'LEI-H-1-2',
      bedAssignmentHistorySequence: 3,
      movementMadeBy: 'SA',
    },
    {
      bookingId: -34,
      livingUnitId: -16,
      assignmentDate: '2020-02-03',
      assignmentDateTime: '2020-02-03T11:00:00',
      assignmentReason: 'ADM',
      assignmentEndDate: '2020-04-03',
      assignmentEndDateTime: '2020-04-03T11:00:00',
      agencyId: 'LEI',
      description: 'LEI-H-1-2',
      bedAssignmentHistorySequence: 4,
      movementMadeBy: 'SA',
    },
  ],
}

describe('Recent cell moves', () => {
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined, undefined))

  let controller
  let req
  let res

  const systemClientToken = 'system_token'

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2020-02-07').getTime())
    prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([])

    res = {
      locals: {
        user: {
          activeCaseLoad: { caseLoadId: 'LEI' },
          allCaseloads: [{ caseLoadId: 'LEI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
      },
      render: jest.fn(),
    }
    req = {}

    controller = recentCellMovesFactory({ prisonerCellAllocationService })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should make a call for cell history for the last 7 days', async () => {
    jest.setSystemTime(new Date('2020-02-07').getTime())

    await controller(req, res)

    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-07')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-06')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-05')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-04')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-03')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-02')
    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(expect.anything(), 'LEI', '2020-02-01')
  })

  it('should count all cell moves over the last 7 days, grouping by day', async () => {
    prisonerCellAllocationService.getHistoryByDate = jest
      .fn()
      .mockImplementation((_token, _agencyId, assignmentDate) => dataSets[assignmentDate] || [])

    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith('cellMove/recentCellMoves.njk', {
      stats: [
        { date: '2020-02-07', dateDisplay: 'Friday 7 February 2020', count: 0 },
        { date: '2020-02-06', dateDisplay: 'Thursday 6 February 2020', count: 0 },
        { date: '2020-02-05', dateDisplay: 'Wednesday 5 February 2020', count: 0 },
        { date: '2020-02-04', dateDisplay: 'Tuesday 4 February 2020', count: 0 },
        { date: '2020-02-03', dateDisplay: 'Monday 3 February 2020', count: 2 },
        { date: '2020-02-02', dateDisplay: 'Sunday 2 February 2020', count: 0 },
        { date: '2020-02-01', dateDisplay: 'Saturday 1 February 2020', count: 1 },
      ],
    })
  })

  it('should only count cell moves for the current caseload', async () => {
    res = {
      locals: {
        user: {
          activeCaseLoad: {
            caseLoadId: 'MDI',
          },
        },
      },
      render: jest.fn(),
    }
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith('cellMove/recentCellMoves.njk', {
      stats: [
        { date: '2020-02-07', dateDisplay: 'Friday 7 February 2020', count: 0 },
        { date: '2020-02-06', dateDisplay: 'Thursday 6 February 2020', count: 0 },
        { date: '2020-02-05', dateDisplay: 'Wednesday 5 February 2020', count: 0 },
        { date: '2020-02-04', dateDisplay: 'Tuesday 4 February 2020', count: 0 },
        { date: '2020-02-03', dateDisplay: 'Monday 3 February 2020', count: 0 },
        { date: '2020-02-02', dateDisplay: 'Sunday 2 February 2020', count: 0 },
        { date: '2020-02-01', dateDisplay: 'Saturday 1 February 2020', count: 0 },
      ],
    })
  })
})
