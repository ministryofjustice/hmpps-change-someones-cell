import cellMoveHistoryFactory from './cellMoveHistory'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import UserService from '../../services/userService'

jest.mock('../../services/analyticsService')
jest.mock('../../services/locationService')
jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

describe('Cell move history', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined, undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))
  const userService = jest.mocked(new UserService(undefined, undefined))

  let req
  let res
  let controller

  const systemClientToken = 'system_token'

  beforeEach(() => {
    prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([])
    userService.getStaffDetails = jest.fn()
    prisonerDetailsService.getPrisoners = jest.fn()
    prisonerCellAllocationService.getOffenderCellHistory = jest.fn().mockResolvedValue({ content: [] })
    locationService.searchGroups = jest.fn().mockResolvedValue([])
    locationService.getAgencyGroupLocationPrefix = jest.fn()
    prisonerCellAllocationService.getCellMoveReasonTypes = jest.fn().mockResolvedValue([
      { code: 'ADM', description: 'Administrative' },
      { code: 'SA', description: 'Safety' },
    ])

    req = {
      query: { date: '2020-10-12' },
      session: { userDetails: { username: 'me' } },
    }
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {
        user: {
          activeCaseLoad: { caseLoadId: 'MDI' },
          allCaseloads: [{ caseLoadId: 'MDI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
      },
    }
    controller = cellMoveHistoryFactory({
      locationService,
      prisonerCellAllocationService,
      prisonerDetailsService,
      userService,
    })
  })

  it('should redirect back to the parent page when no date is supplied', async () => {
    delete req.query
    await controller(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/recent-cell-moves')
  })

  it('should make a request for cell move for the date passed in', async () => {
    await controller(req, res)

    expect(prisonerCellAllocationService.getHistoryByDate).toHaveBeenCalledWith(systemClientToken, 'MDI', '2020-10-12')
  })

  it('should return the page header correctly formatted', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2020-02-07').getTime())

    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/cellMoveHistory.njk',
      expect.objectContaining({
        title: `Cell moves completed on Monday 12 October 2020`,
      }),
    )

    jest.useRealTimers()
  })

  describe('should return cell move history for the given date', () => {
    beforeEach(() => {
      prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
        {
          bookingId: -34,
          livingUnitId: -16,
          assignmentDate: '2020-02-03',
          assignmentDateTime: '2020-02-03T11:00:00',
          assignmentReason: 'ADM',
          agencyId: 'MDI',
          description: 'MDI-H-1-2',
          bedAssignmentHistorySequence: 3,
          movementMadeBy: 'SA',
          offenderNo: 'A12345',
        },
      ])
      prisonerDetailsService.getPrisoners = jest
        .fn()
        .mockResolvedValue([{ bookingId: -34, offenderNo: 'A12345', firstName: 'BOB', lastName: 'LAST' }])

      userService.getStaffDetails = jest
        .fn()
        .mockResolvedValue({ username: 'SA', firstName: 'LOU', lastName: 'Becker' })
    })

    it('should return defaults', async () => {
      prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
        {
          bookingId: -34,
          livingUnitId: -16,
          assignmentDateTime: '2020-02-03T11:00:00',
          agencyId: 'MDI',
          description: 'MDI-H-1-2',
          movementMadeBy: 'SA',
          offenderNo: 'A12345',
        },
      ])
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              movedFrom: 'No cell allocated',
              reason: 'Not entered',
            }),
          ],
        }),
      )
    })

    it('should return the offenders name properly formatted, and the offender number', async () => {
      prisonerDetailsService.getPrisoners = jest
        .fn()
        .mockResolvedValue([{ bookingId: -34, offenderNo: 'A12345', firstName: 'BOB', lastName: 'LAST' }])

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              prisonerName: 'Last, Bob',
              offenderNo: 'A12345',
            }),
          ],
        }),
      )
    })

    it('should return the location the offender was moved to', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              movedTo: 'H-1-2',
            }),
          ],
        }),
      )
    })

    it('should return the name of staff member who made the assignment in the correct format', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              movedBy: 'Lou Becker',
            }),
          ],
        }),
      )
    })

    it('should return reason for moving', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              reason: 'Administrative',
            }),
          ],
        }),
      )
    })

    it('should return the time of the moment in the correct format', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              time: '11:00',
            }),
          ],
        }),
      )
    })

    it('should format locations correctly', async () => {
      prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
        {
          assignmentDate: '2016-11-01',
          assignmentEndDate: '2020-02-03',
          agencyId: 'MDI',
          description: 'MDI-RECP',
          bedAssignmentHistorySequence: 2,
          offenderNo: 'A12345',
        },
        {
          assignmentDate: '2016-11-09',
          assignmentReason: 'ADM',
          assignmentEndDate: '2016-11-16',
          agencyId: 'MDI',
          description: 'MDI-COURT',
          bedAssignmentHistorySequence: 3,
          offenderNo: 'A12345',
        },
        {
          assignmentDate: '2016-11-09',
          assignmentReason: 'ADM',
          assignmentEndDate: '2016-11-16',
          agencyId: 'MDI',
          description: 'MDI-CSWAP',
          bedAssignmentHistorySequence: 3,
          offenderNo: 'A12345',
        },
      ])

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveHistory.njk',
        expect.objectContaining({
          historyByDate: [
            expect.objectContaining({
              movedTo: 'Reception',
            }),
            expect.objectContaining({
              movedTo: 'Court',
            }),
            expect.objectContaining({
              movedTo: 'No cell allocated',
            }),
          ],
        }),
      )
    })

    it('should make a call for offender cell history', async () => {
      await controller(req, res)

      expect(prisonerCellAllocationService.getOffenderCellHistory).toHaveBeenCalledWith(systemClientToken, undefined)
    })

    it('should make a call to get prisoner data using client credentials', async () => {
      await controller(req, res)

      expect(prisonerDetailsService.getPrisoners).toHaveBeenCalledWith(systemClientToken, ['A12345'])
    })

    describe('Filtering', () => {
      beforeEach(() => {
        prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
          {
            assignmentDate: '2016-11-01',
            assignmentEndDate: '2020-02-03',
            agencyId: 'MDI',
            description: 'MDI-1-2-3',
            bedAssignmentHistorySequence: 1,
            offenderNo: 'A12345',
            assignmentReason: 'ADM',
          },
          {
            assignmentDate: '2016-11-01',
            assignmentEndDate: '2020-02-03',
            agencyId: 'MDI',
            description: 'MDI-2-2-3',
            bedAssignmentHistorySequence: 1,
            offenderNo: 'A12345',
            assignmentReason: 'BEH',
          },
          {
            assignmentDate: '2016-11-09',
            assignmentEndDate: '2016-11-16',
            agencyId: 'LEI',
            description: 'LEI-COURT',
            bedAssignmentHistorySequence: 1,
            offenderNo: 'A12345',
            assignmentReason: 'BEH',
          },
          {
            assignmentDate: '2016-11-09',
            assignmentEndDate: '2016-11-16',
            agencyId: 'LEI',
            description: 'LEI-CSWAP',
            bedAssignmentHistorySequence: 1,
            offenderNo: 'A12345',
            assignmentReason: 'BEH',
          },
        ])
      })

      it('should filter by location', async () => {
        res.locals = {
          ...res.locals,
          user: {
            activeCaseLoad: {
              caseLoadId: 'LEI',
            },
          },
        }
        locationService.getAgencyGroupLocationPrefix = jest.fn().mockResolvedValue({ locationPrefix: 'LEI-' })

        req.query.locationId = 'House block 1'
        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/cellMoveHistory.njk',
          expect.objectContaining({
            historyByDate: [
              expect.objectContaining({
                movedTo: 'Court',
              }),
              expect.objectContaining({
                movedTo: 'No cell allocated',
              }),
            ],
          }),
        )
      })

      it('should filter by movement reason', async () => {
        req.query.reason = 'ADM'
        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/cellMoveHistory.njk',
          expect.objectContaining({
            historyByDate: [
              expect.objectContaining({
                reason: 'Administrative',
                movedTo: '1-2-3',
              }),
            ],
          }),
        )
      })
    })

    describe('Previous location', () => {
      beforeEach(() => {
        prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
          {
            livingUnitId: 1,
            assignmentDate: '2020-02-03',
            agencyId: 'MDI',
            description: 'MDI-H-1-2',
            offenderNo: 'A12345',
          },
        ])
      })
      it('should return the moved from location', async () => {
        prisonerCellAllocationService.getOffenderCellHistory = jest.fn().mockResolvedValue({
          content: [
            {
              livingUnitId: 10,
              assignmentDate: '2016-11-01',
              assignmentEndDate: '2020-02-03',
              agencyId: 'MDI',
              description: 'MDI-COURT',
              bedAssignmentHistorySequence: 2,
              offenderNo: 'A12345',
            },
            {
              livingUnitId: 20,
              assignmentDate: '2016-11-09',
              assignmentReason: 'ADM',
              assignmentEndDate: '2016-11-16',
              agencyId: 'MDI',
              description: 'MDI-H3-B3-018',
              bedAssignmentHistorySequence: 3,
              offenderNo: 'A12345',
            },
          ],
        })

        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/cellMoveHistory.njk',
          expect.objectContaining({
            historyByDate: [
              expect.objectContaining({
                movedFrom: 'Court',
              }),
            ],
          }),
        )
      })

      it('should use latest move when there are multiple for the same day', async () => {
        prisonerCellAllocationService.getOffenderCellHistory = jest.fn().mockResolvedValue({
          content: [
            {
              livingUnitId: 10,
              assignmentDate: '2016-11-01',
              assignmentEndDate: '2020-02-03',
              agencyId: 'MDI',
              description: 'MDI-H3-B2-014',
              bedAssignmentHistorySequence: 1,
              offenderNo: 'A12345',
            },
            {
              livingUnitId: 20,
              assignmentDate: '2016-11-01',
              assignmentReason: 'ADM',
              assignmentEndDate: '2020-02-03',
              agencyId: 'MDI',
              description: 'MDI-H3-B2-013',
              bedAssignmentHistorySequence: 2,
              offenderNo: 'A12345',
            },
            {
              livingUnitId: 1,
              assignmentDate: '2020-02-03',
              assignmentEndDate: '2020-02-03',
              agencyId: 'MDI',
              description: 'MDI-H-1-2',
              bedAssignmentHistorySequence: 3,
              offenderNo: 'A12345',
            },
          ],
        })

        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/cellMoveHistory.njk',
          expect.objectContaining({
            historyByDate: [
              expect.objectContaining({
                movedFrom: 'H3-B2-013',
              }),
            ],
          }),
        )
      })

      it('should sort by latest assignment date time', async () => {
        prisonerCellAllocationService.getHistoryByDate = jest.fn().mockResolvedValue([
          {
            assignmentDate: '2020-02-03',
            assignmentDateTime: '2020-02-03T20:10:11',
            agencyId: 'MDI',
            description: 'MDI-H-1-2',
            offenderNo: 'A12345',
          },
          {
            assignmentDate: '2020-02-03',
            assignmentDateTime: '2020-02-03T10:10:11',
            agencyId: 'MDI',
            description: 'MDI-H-1-3',
            offenderNo: 'A12345',
          },
        ])

        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/cellMoveHistory.njk',
          expect.objectContaining({
            historyByDate: [
              expect.objectContaining({
                movedTo: 'H-1-2',
                time: '20:10',
              }),
              expect.objectContaining({
                movedTo: 'H-1-3',
                time: '10:10',
              }),
            ],
          }),
        )
      })
    })
  })
})
