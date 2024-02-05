import moment from 'moment'
import viewNonAssociations from './viewNonAssociations'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerDetailsService')

describe('view non associations', () => {
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let req
  let res
  let controller

  const tomorrow = moment().add(1, 'days')

  const offenderNo = 'ABC123'

  const getDetailsResponse = {
    bookingId: 1234,
    offenderNo,
    firstName: 'Test',
    lastName: 'User',
    assignedLivingUnit: {
      agencyId: 'MDI',
      locationId: 12345,
      description: '1-2-012',
      agencyName: 'Moorland (HMP & YOI)',
    },
  }

  const systemClientToken = 'system_token'

  beforeEach(() => {
    req = {
      originalUrl: 'http://localhost',
      params: { offenderNo },
      query: {},
      headers: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost'),
    }
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
      status: jest.fn(),
    }

    prisonerDetailsService.getDetails = jest.fn().mockImplementation((_, requestedOffenderNo) => ({
      ...getDetailsResponse,
      offenderNo: requestedOffenderNo,
    }))

    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
      offenderNo: 'ABC123',
      firstName: 'Fred',
      lastName: 'Bloggs',
      agencyDescription: 'Moorland (HMP & YOI)',
      assignedLivingUnitDescription: 'MDI-1-1-3',
      nonAssociations: [
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:ss'),
          authorisedBy: 'string',
          comments: 'Test comment 1',
          offenderNonAssociation: {
            offenderNo: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
          authorisedBy: 'string',
          comments: 'Test comment 1',
          offenderNonAssociation: {
            offenderNo: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
        {
          reasonCode: 'RIV',
          reasonDescription: 'Rival gang',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss'),
          expiryDate: tomorrow,
          authorisedBy: 'string',
          comments: 'Test comment 2',
          offenderNonAssociation: {
            offenderNo: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            reasonCode: 'RIV',
            reasonDescription: 'Rival gang',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: '2018-12-01T13:34:00',
          expiryDate: '2019-12-01T13:34:00',
          authorisedBy: 'string',
          comments: 'Test comment 3',
          offenderNonAssociation: {
            offenderNo: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
      ],
    })

    controller = viewNonAssociations({ nonAssociationsService, prisonerDetailsService })
  })

  it('Makes the expected API calls', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, offenderNo)
    expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, offenderNo)
  })

  it('Should render error template when there is an API error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getDetails.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrow(error)

    expect(res.locals.homeUrl).toBe('/prisoner/ABC123')
  })

  it('populates the data correctly', async () => {
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/nonAssociations.njk',
      expect.objectContaining({
        nonAssociationsRows: [
          {
            comment: 'Test comment 1',
            effectiveDate: moment().format('D MMMM YYYY'),
            location: '1-2-012',
            name: 'Bloggs, Joseph',
            otherOffenderKey: 'Joseph Bloggs is',
            otherOffenderRole: 'Perpetrator',
            prisonNumber: 'ABC124',
            selectedOffenderKey: 'Test User is',
            selectedOffenderRole: 'Victim',
            type: 'Do Not Locate on Same Wing',
          },
          {
            comment: 'Test comment 2',
            effectiveDate: moment().subtract(1, 'years').format('D MMMM YYYY'),
            location: '1-2-012',
            name: 'Bloggs, Jim',
            otherOffenderKey: 'Jim Bloggs is',
            otherOffenderRole: 'Rival gang',
            prisonNumber: 'ABC125',
            selectedOffenderKey: 'Test User is',
            selectedOffenderRole: 'Rival gang',
            type: 'Do Not Locate on Same Wing',
          },
        ],
        prisonerName: 'Test User',
        breadcrumbPrisonerName: 'User, Test',
        backLink: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        backLinkText: 'Return to search for a cell',
      }),
    )
  })

  it('sets the back link and text correctly when referer data is present', async () => {
    req = { ...req, headers: { referer: `/prisoner/${offenderNo}/cell-move/select-cell` } }
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/nonAssociations.njk',
      expect.objectContaining({
        backLink: `/prisoner/${offenderNo}/cell-move/select-cell`,
        backLinkText: 'Return to select an available cell',
      }),
    )
  })
})
