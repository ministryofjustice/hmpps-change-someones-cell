import viewResidentialLocationController from './cellMoveViewResidentialLocation'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

jest.mock('../../services/locationService')
jest.mock('../../services/prisonerCellAllocationService')

describe('View Residential Location', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined))

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

    prisonerCellAllocationService.getInmates = jest.fn().mockReturnValue([])

    controller = viewResidentialLocationController({ locationService, prisonerCellAllocationService })
  })

  describe('index', () => {
    it('should make a call to whereabouts to get available locations', async () => {
      req.query = {}

      await controller(req, res)

      expect(locationService.searchGroups).toHaveBeenCalledWith(systemClientToken, 'MDI')
    })

    it('should make a call to whereabouts to get location id from the location key', async () => {
      const locationValue = ''
      req.query = {
        location: locationValue,
      }

      await controller(req, res)

      expect(locationService.getAgencyGroupLocationPrefix).toHaveBeenCalledWith(systemClientToken, 'MDI', locationValue)
    })

    it('should make a call to get inmates using shortened location prefix from whereabouts if present', async () => {
      locationService.getAgencyGroupLocationPrefix = jest.fn().mockReturnValue({
        locationPrefix: 'MDI-1-',
      })

      req.query = {
        location: 'A location',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.getInmates).toHaveBeenCalledWith(systemClientToken, 'MDI-1', null, true)
    })

    it('should make a call to get inmates using location id built from case load and location key if whereabouts prefix not present', async () => {
      locationService.getAgencyGroupLocationPrefix = jest.fn().mockReturnValue(null)

      req.query = {
        location: '1',
      }

      await controller(req, res)

      expect(prisonerCellAllocationService.getInmates).toHaveBeenCalledWith(systemClientToken, 'MDI-1', null, true)
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
          alertsDetails: ['XA', 'XGANG'],
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
          alertsDetails: ['XCU'],
        },
      ]
      prisonerCellAllocationService.getInmates = jest.fn().mockReturnValue(inmates)

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
              age: 29,
              agencyId: 'MDI',
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
              alertsDetails: ['XA', 'XGANG'],
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
              cellSearchUrl: '/prisoner/A1234BC/cell-move/search-for-cell?returnToService=default',
              profileUrl: 'http://localhost:3000/prisoner/A1234BC',
            },
            {
              age: 30,
              agencyId: 'MDI',
              alerts: [],
              alertsDetails: ['XCU'],
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
