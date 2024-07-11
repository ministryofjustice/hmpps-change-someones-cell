import moment from 'moment'
import viewNonAssociations from './viewNonAssociations'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerDetailsService')

describe('view non associations', () => {
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'

  const getDetailsResponse = {
    bookingId: 1234,
    prisonerNumber: offenderNo,
    firstName: 'Test',
    lastName: 'User',
    prisonId: 'MDI',
    cellLocation: '1-2-012',
    prisonName: 'Moorland (HMP & YOI)',
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

    prisonerDetailsService.getPrisoner = jest.fn().mockImplementation((_, requestedOffenderNo) => ({
      ...getDetailsResponse,
      prisonerNumber: requestedOffenderNo,
    }))

    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
      prisonerNumber: 'ABC123',
      firstName: 'Fred',
      lastName: 'Bloggs',
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      cellLocation: '1-1-3',
      openCount: 2,
      closedCount: 0,
      nonAssociations: [
        {
          reason: 'GANG',
          reasonDescription: 'Gangs',
          role: 'VIC',
          roleDescription: 'Victim',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          whenCreated: moment().format('YYYY-MM-DDTHH:mm:ss'),
          comment: 'Test comment 1',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
        {
          reason: 'GANG',
          reasonDescription: 'Gangs',
          role: 'RIV',
          roleDescription: 'Rival gang',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          whenCreated: moment().subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss'),
          comment: 'Test comment 2',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            role: 'RIV',
            roleDescription: 'Rival gang',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
      ],
    } as PrisonerNonAssociation)

    controller = viewNonAssociations({ prisonerDetailsService, nonAssociationsService })
  })

  it('Makes the expected API calls', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getPrisoner).toHaveBeenCalledWith(systemClientToken, offenderNo)
    expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, offenderNo)
  })

  it('Should render error template when there is an API error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getPrisoner.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrow(error)

    expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/ABC123`)
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
            location: '2-1-3',
            name: 'Bloggs, Joseph',
            otherOffenderKey: 'Joseph Bloggs is',
            otherOffenderRole: 'Perpetrator',
            prisonNumber: 'ABC124',
            reason: 'Gangs',
            selectedOffenderKey: 'Test User is',
            selectedOffenderRole: 'Victim',
            type: 'Do Not Locate on Same Wing',
          },
          {
            comment: 'Test comment 2',
            effectiveDate: moment().subtract(1, 'years').format('D MMMM YYYY'),
            location: '2-1-3',
            name: 'Bloggs, Jim',
            otherOffenderKey: 'Jim Bloggs is',
            otherOffenderRole: 'Rival gang',
            prisonNumber: 'ABC125',
            reason: 'Gangs',
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
    req = { ...req, session: { referrerUrl: `/prisoner/${offenderNo}/cell-move/select-cell` } }
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
