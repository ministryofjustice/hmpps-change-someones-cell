import temporaryMoveController from './cellMoveTemporaryMove'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

jest.mock('../../services/prisonerCellAllocationService')

describe('Move someone temporarily out of a cell', () => {
  const prisonerCellAllocationService = jest.mocked(
    new PrisonerCellAllocationService(undefined, undefined, undefined, undefined, undefined),
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

    prisonerCellAllocationService.searchInmates = jest.fn().mockReturnValue([])

    controller = temporaryMoveController({ prisonerCellAllocationService })
  })

  describe('index', () => {
    it('should search the current active caseload for the specified search terms', async () => {
      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.searchInmates).toHaveBeenCalledWith(systemClientToken, 'MDI', {
        term: 'Smith',
      })
    })

    it('should render template with correct data when searched', async () => {
      const inmates = [
        {
          prisonerNumber: 'A1234BC',
          firstName: 'JOHN',
          lastName: 'SMITH',
          cellLocation: 'UNIT-1',
          category: 'C',
          alerts: [{ alertCode: 'XA' }, { alertCode: 'XVL' }],
        },
        {
          prisonerNumber: 'B4567CD',
          firstName: 'STEVE',
          lastName: 'SMITH',
          cellLocation: 'CSWAP',
          category: 'C',
          alerts: [{ alertCode: 'RSS' }, { alertCode: 'XC' }],
        },
      ]
      prisonerCellAllocationService.searchInmates = jest.fn().mockReturnValue(inmates)

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
              offenderNo: 'A1234BC',
              assignedLivingUnitDesc: 'UNIT-1',
              name: 'Smith, John',
              formattedName: 'John Smith',
              cellHistoryUrl: 'http://localhost:3000/prisoner/A1234BC/location-details',
              cellMoveUrl: '/prisoner/A1234BC/cell-move/confirm-cell-move?cellId=C-SWAP',
              profileUrl: 'http://localhost:3000/prisoner/A1234BC',
            },
            {
              offenderNo: 'B4567CD',
              assignedLivingUnitDesc: 'No cell allocated',
              name: 'Smith, Steve',
              formattedName: 'Steve Smith',
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
