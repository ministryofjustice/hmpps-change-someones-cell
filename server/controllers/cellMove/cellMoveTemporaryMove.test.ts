import temporaryMoveController from './cellMoveTemporaryMove'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

jest.mock('../../services/prisonerCellAllocationService')

describe('Move someone temporarily out of a cell', () => {
  const prisonerCellAllocationService = jest.mocked(
    new PrisonerCellAllocationService(undefined, undefined, undefined, undefined),
  )

  let req
  let res
  let controller

  const systemClientToken = 'system_token'

  beforeEach(() => {
    req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost'),
      baseUrl: '/temporary-move',
      query: {},
      body: {},
      session: { userDetails: { username: 'me' } },
    }
    res = {
      locals: {
        user: {
          activeCaseLoad: { caseLoadId: 'MDI' },
          allCaseloads: [{ caseLoadId: 'MDI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
        responseHeaders: {
          'total-records': 0,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn(),
    }

    prisonerCellAllocationService.getInmates = jest.fn().mockReturnValue([])

    controller = temporaryMoveController({ prisonerCellAllocationService })
  })

  describe('index', () => {
    it('should make make a call to get inmates using current active caseload and the specified search terms', async () => {
      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.getInmates).toHaveBeenCalledWith(systemClientToken, 'MDI', 'Smith')
    })

    it('should render template with correct data when searched', async () => {
      const inmates = [
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
          iepLevel: 'Standard',
          categoryCode: 'C',
          alertsDetails: ['XA', 'XVL'],
        },
        {
          bookingId: 2,
          offenderNo: 'B4567CD',
          firstName: 'STEVE',
          lastName: 'SMITH',
          dateOfBirth: '1989-11-12',
          age: 30,
          agencyId: 'MDI',
          assignedLivingUnitId: 2,
          assignedLivingUnitDesc: 'CSWAP',
          iepLevel: 'Standard',
          categoryCode: 'C',
          alertsDetails: ['RSS', 'XC'],
        },
      ]
      prisonerCellAllocationService.getInmates = jest.fn().mockReturnValue(inmates)

      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveTemporaryMove.njk',
        expect.objectContaining({
          showResults: true,
          showHelp: false,
          results: [
            {
              age: 29,
              agencyId: 'MDI',
              alertsDetails: ['XA', 'XVL'],
              assignedLivingUnitDesc: 'UNIT-1',
              assignedLivingUnitId: 1,
              bookingId: 1,
              categoryCode: 'C',
              dateOfBirth: '1990-10-12',
              firstName: 'JOHN',
              iepLevel: 'Standard',
              lastName: 'SMITH',
              name: 'Smith, John',
              formattedName: 'John Smith',
              offenderNo: 'A1234BC',
              cellHistoryUrl: 'http://localhost:3000/prisoner/A1234BC/location-details',
              cellMoveUrl: '/prisoner/A1234BC/cell-move/confirm-cell-move?cellId=C-SWAP',
              profileUrl: 'http://localhost:3000/prisoner/A1234BC',
            },
            {
              age: 30,
              agencyId: 'MDI',
              alertsDetails: ['RSS', 'XC'],
              assignedLivingUnitDesc: 'No cell allocated',
              assignedLivingUnitId: 2,
              bookingId: 2,
              categoryCode: 'C',
              dateOfBirth: '1989-11-12',
              firstName: 'STEVE',
              iepLevel: 'Standard',
              lastName: 'SMITH',
              name: 'Smith, Steve',
              formattedName: 'Steve Smith',
              offenderNo: 'B4567CD',
              cellHistoryUrl: 'http://localhost:3000/prisoner/B4567CD/location-details',
              cellMoveUrl: '/prisoner/B4567CD/cell-move/confirm-cell-move?cellId=C-SWAP',
              profileUrl: 'http://localhost:3000/prisoner/B4567CD',
            },
          ],
          totalOffenders: 2,
        }),
      )
    })

    it('should render template without results but with help when not searched', async () => {
      req.query = {}

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveTemporaryMove.njk',
        expect.objectContaining({
          showResults: false,
          showHelp: true,
          errors: [],
        }),
      )
    })

    it('should render template with error and without help when searched without keywords', async () => {
      req.query = {
        keywords: '',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveTemporaryMove.njk',
        expect.objectContaining({
          showResults: false,
          showHelp: false,
          errors: [
            {
              href: '#keywords',
              text: 'Enter a prisoner’s name or number',
            },
          ],
        }),
      )
    })
  })
})
