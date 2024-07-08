import { Offender } from '../../data/prisonApiClient'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import prisonerSearchController from './cellMovePrisonerSearch'

jest.mock('../../services/prisonerCellAllocationService')

describe('Prisoner search', () => {
  const prisonerCellAllocationService = jest.mocked(
    new PrisonerCellAllocationService(undefined, undefined, undefined, undefined),
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

    const offenders: Promise<Offender[]> = Promise.resolve([])
    prisonerCellAllocationService.getInmates.mockReturnValue(offenders)

    controller = prisonerSearchController({ prisonerCellAllocationService })
  })

  describe('index', () => {
    it('should make make a call to get inmates using current active caseload and the specified search terms', async () => {
      req.query = {
        keywords: 'Smith',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.getInmates).toHaveBeenCalledWith('system_client_token', 'MDI', 'Smith', true)
    })

    it('should render template with correct data when searched', async () => {
      const inmates: Offender[] = [
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
          alertsDetails: ['XA', 'HID'],
          alertsCodes: ['XA', 'HID'],
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
          categoryCode: 'C',
          alertsDetails: ['XSA', 'SA'],
          alertsCodes: ['XSA', 'SA'],
        },
      ]
      prisonerCellAllocationService.getInmates.mockReturnValue(Promise.resolve(inmates))

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
              age: 29,
              agencyId: 'MDI',
              alerts: [
                {
                  alertCodes: ['XA'],
                  classes: 'alert-status alert-status--security',
                  label: 'Arsonist',
                },
              ],
              alertsCodes: ['XA', 'HID'],
              alertsDetails: ['XA', 'HID'],
              assignedLivingUnitDesc: 'UNIT-1',
              assignedLivingUnitId: 1,
              bookingId: 1,
              categoryCode: 'C',
              dateOfBirth: '1990-10-12',
              firstName: 'JOHN',
              lastName: 'SMITH',
              name: 'Smith, John',
              formattedName: 'John Smith',
              offenderNo: 'A1234BC',
              cellHistoryUrl: 'http://localhost:3000/prisoner/A1234BC/location-details',
              cellSearchUrl: '/prisoner/A1234BC/cell-move/search-for-cell?returnToService=default',
            },
            {
              age: 30,
              agencyId: 'MDI',
              alerts: [],
              alertsCodes: ['XSA', 'SA'],
              alertsDetails: ['XSA', 'SA'],
              assignedLivingUnitDesc: 'No cell allocated',
              assignedLivingUnitId: 2,
              bookingId: 2,
              categoryCode: 'C',
              dateOfBirth: '1989-11-12',
              firstName: 'STEVE',
              lastName: 'SMITH',
              name: 'Smith, Steve',
              formattedName: 'Steve Smith',
              offenderNo: 'B4567CD',
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
