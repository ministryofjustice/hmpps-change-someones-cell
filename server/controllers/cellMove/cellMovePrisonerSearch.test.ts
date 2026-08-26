import { Prisoner } from '../../data/prisonerSearchApiClient'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import prisonerSearchController from './cellMovePrisonerSearch'

jest.mock('../../services/prisonerCellAllocationService')

describe('Prisoner search', () => {
  const prisonerCellAllocationService = jest.mocked(
    new PrisonerCellAllocationService(undefined, undefined, undefined, undefined, undefined),
  )
  let req
  let res
  let controller

  beforeEach(() => {
    req = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost'),
      baseUrl: '/prisoner-search',
      query: {},
      body: {},
      session: { userDetails: { username: 'me' } },
      user: { username: 'me' },
    }
    res = {
      locals: {
        user: { activeCaseLoad: { caseLoadId: 'MDI' } },
        responseHeaders: {
          'total-records': 0,
        },
        systemClientToken: 'system_client_token',
      },
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn(),
    }

    prisonerCellAllocationService.searchInmates = jest.fn().mockResolvedValue([])

    controller = prisonerSearchController({ prisonerCellAllocationService })
  })

  describe('index', () => {
    it('should search the current active caseload for the specified search terms', async () => {
      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.searchInmates).toHaveBeenCalledWith('system_client_token', 'MDI', {
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
          alerts: [
            { alertCode: 'XA', active: true, expired: false },
            { alertCode: 'HID', active: true, expired: false },
          ],
        },
        {
          prisonerNumber: 'B4567CD',
          firstName: 'STEVE',
          lastName: 'SMITH',
          cellLocation: 'CSWAP',
          category: 'B',
          alerts: [{ alertCode: 'XSA', active: true, expired: false }],
        },
      ] as Prisoner[]

      prisonerCellAllocationService.searchInmates = jest.fn().mockResolvedValue(inmates)

      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMovePrisonerSearch.njk',
        expect.objectContaining({
          showResults: true,
          results: [
            {
              offenderNo: 'A1234BC',
              assignedLivingUnitDesc: 'UNIT-1',
              categoryCode: 'C',
              alerts: [
                { alertCodes: ['XA'], classes: 'alert-status alert-status--security', label: 'Arsonist' },
                { alertCodes: ['HID'], classes: 'alert-status alert-status--medical', label: 'Hidden disability' },
              ],
              name: 'Smith, John',
              formattedName: 'John Smith',
              cellHistoryUrl: 'http://localhost:3000/prisoner/A1234BC/location-details',
              cellSearchUrl: '/prisoner/A1234BC/cell-move/search-for-cell?returnToService=default',
            },
            {
              offenderNo: 'B4567CD',
              assignedLivingUnitDesc: 'No cell allocated',
              categoryCode: 'B',
              alerts: [
                { alertCodes: ['XSA', 'SA'], classes: 'alert-status alert-status--security', label: 'Staff assaulter' },
              ],
              name: 'Smith, Steve',
              formattedName: 'Steve Smith',
              cellHistoryUrl: 'http://localhost:3000/prisoner/B4567CD/location-details',
              cellSearchUrl: '/prisoner/B4567CD/cell-move/search-for-cell?returnToService=default',
            },
          ],
          totalOffenders: 2,
        }),
      )
    })

    it('should render template without results when not searched', async () => {
      req.query = {}

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMovePrisonerSearch.njk',
        expect.objectContaining({
          showResults: false,
          errors: [],
        }),
      )
    })

    it('should render template with error when searched without keywords', async () => {
      req.query = {
        keywords: '',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMovePrisonerSearch.njk',
        expect.objectContaining({
          showResults: false,
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
