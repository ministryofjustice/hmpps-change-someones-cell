import viewResidentialLocationController from './cellMoveViewResidentialLocation'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import { Prisoner } from '../../data/prisonerSearchApiClient'

jest.mock('../../services/locationService')
jest.mock('../../services/prisonerCellAllocationService')

describe('View Residential Location', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
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
      baseUrl: '/view-residential-location',
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

    locationService.searchGroups = jest.fn().mockReturnValue([
      {
        name: 'Houseblock 1',
        key: 'H 1',
      },
      {
        name: 'Houseblock 2',
        key: 'H 2',
      },
    ])

    locationService.getAgencyGroupLocationPrefix = jest.fn().mockReturnValue({
      locationPrefix: '1',
    })

    prisonerCellAllocationService.searchInmates = jest.fn().mockResolvedValue([])

    controller = viewResidentialLocationController({
      locationService,
      prisonerCellAllocationService,
    })
  })

  describe('index', () => {
    it('should make a call to the locations API to get available locations', async () => {
      req.query = {}

      await controller(req, res)

      expect(locationService.searchGroups).toHaveBeenCalledWith(systemClientToken, 'MDI')
    })

    it('should make a call to the locations API to get location id from the location key', async () => {
      const locationValue = ''
      req.query = {
        location: locationValue,
      }

      await controller(req, res)

      expect(locationService.getAgencyGroupLocationPrefix).toHaveBeenCalledWith(systemClientToken, 'MDI', locationValue)
    })

    it('should make a call to get inmates using shortened location prefix from the locations API if present', async () => {
      locationService.getAgencyGroupLocationPrefix = jest.fn().mockReturnValue({
        locationPrefix: 'MDI-1-',
      })

      req.query = {
        location: 'A location',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.searchInmates).toHaveBeenCalledWith(systemClientToken, 'MDI', {
        cellLocationPrefix: 'MDI-1',
      })
    })

    it('should make a call to get inmates using location id built from case load and location key if location prefix not present', async () => {
      locationService.getAgencyGroupLocationPrefix = jest.fn().mockReturnValue(null)

      req.query = {
        location: '1',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.searchInmates).toHaveBeenCalledWith(systemClientToken, 'MDI', {
        cellLocationPrefix: 'MDI-1',
      })
    })

    it('should render template with correct data when searched', async () => {
      const inmates = [
        {
          prisonerNumber: 'A1234BC',
          firstName: 'JOHN',
          lastName: 'SMITH',
          cellLocation: 'UNIT-1',
          category: 'A',
          alerts: [
            { alertCode: 'XA', active: true, expired: false },
            { alertCode: 'XGANG', active: true, expired: false },
          ],
        },
        {
          prisonerNumber: 'B4567CD',
          firstName: 'STEVE',
          lastName: 'SMITH',
          cellLocation: 'CSWAP',
          category: 'C',
          alerts: [{ alertCode: 'XCU', active: true, expired: false }],
        },
      ] as Prisoner[]

      prisonerCellAllocationService.searchInmates = jest.fn().mockResolvedValue(inmates)

      req.query = {
        location: 'H 1',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveViewResidentialLocation.njk',
        expect.objectContaining({
          showResults: true,
          locationOptions: [
            {
              text: 'Select',
              value: 'SELECT',
            },
            {
              text: 'Houseblock 1',
              value: 'H 1',
            },
            {
              text: 'Houseblock 2',
              value: 'H 2',
            },
          ],
          results: [
            {
              offenderNo: 'A1234BC',
              assignedLivingUnitDesc: 'UNIT-1',
              categoryCode: 'A',
              alerts: [
                {
                  alertCodes: ['XA'],
                  classes: 'alert-status alert-status--security',
                  label: 'Arsonist',
                },
                {
                  alertCodes: ['XGANG'],
                  classes: 'alert-status alert-status--security',
                  label: 'Gang member',
                },
              ],
              name: 'Smith, John',
              formattedName: 'John Smith',
              cellHistoryUrl: 'http://localhost:3000/prisoner/A1234BC/location-details',
              cellSearchUrl: '/prisoner/A1234BC/cell-move/search-for-cell?returnToService=default',
              profileUrl: 'http://localhost:3000/prisoner/A1234BC',
            },
            {
              offenderNo: 'B4567CD',
              assignedLivingUnitDesc: 'No cell allocated',
              categoryCode: 'C',
              alerts: [
                {
                  alertCodes: ['XCU'],
                  classes: 'alert-status alert-status--security',
                  label: 'Controlled unlock',
                },
              ],
              name: 'Smith, Steve',
              formattedName: 'Steve Smith',
              cellHistoryUrl: 'http://localhost:3000/prisoner/B4567CD/location-details',
              cellSearchUrl: '/prisoner/B4567CD/cell-move/search-for-cell?returnToService=default',
              profileUrl: 'http://localhost:3000/prisoner/B4567CD',
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
        'cellMove/cellMoveViewResidentialLocation.njk',
        expect.objectContaining({
          showResults: false,
          locationOptions: [
            {
              text: 'Select',
              value: 'SELECT',
            },
            {
              text: 'Houseblock 1',
              value: 'H 1',
            },
            {
              text: 'Houseblock 2',
              value: 'H 2',
            },
          ],
        }),
      )
    })

    it('should render template with error when searched without keywords', async () => {
      req.query = {
        location: 'SELECT',
      }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/cellMoveViewResidentialLocation.njk',
        expect.objectContaining({
          showResults: false,
          locationOptions: [
            {
              text: 'Select',
              value: 'SELECT',
            },
            {
              text: 'Houseblock 1',
              value: 'H 1',
            },
            {
              text: 'Houseblock 2',
              value: 'H 2',
            },
          ],
          errors: [
            {
              href: '#location',
              text: 'Select a residential location',
            },
          ],
        }),
      )
    })
  })
})
