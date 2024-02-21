import spaceCreatedController from './spaceCreated'
import { OffenderDetails } from '../../data/prisonApiClient'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

jest.mock('../../services/prisonerDetailsService')

describe('Space created', () => {
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let req
  let res
  let controller

  const systemClientToken = 'system_token'
  const offenderNo = 'ABC123'

  const details: OffenderDetails = {
    bookingId: 1234,
    offenderNo: 'A1234',
    firstName: 'Barry',
    lastName: 'Jones',
    csraClassificationCode: 'HI',
    agencyId: 'MDI',
    assignedLivingUnit: {
      agencyId: 'BXI',
      locationId: 5432,
      description: '1-1-001',
      agencyName: 'Brixton (HMP)',
    },
    alerts: [],
    dateOfBirth: '1990-10-12',
    age: 29,
    assignedLivingUnitId: 5432,
    assignedLivingUnitDesc: '1-1-001',
    categoryCode: 'C',
    alertsDetails: ['XA', 'XVL'],
    alertsCodes: ['XA', 'XVL'],
    assessments: [],
  }

  beforeEach(() => {
    req = {
      originalUrl: 'http://localhost',
      params: { offenderNo },
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
    }

    controller = spaceCreatedController({ prisonerDetailsService })
  })

  describe('with data', () => {
    beforeEach(() => {
      prisonerDetailsService.getDetails.mockResolvedValue(details)
    })

    it('should render the correct template with the correct values', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith('cellMove/spaceCreated.njk', {
        name: 'Barry Jones',
        prisonerSearchLink: '/prisoner-search',
        title: 'Barry Jones has been moved',
      })
    })
  })

  describe('when there are errors', () => {
    it('set the redirect and home urls and throw the error', async () => {
      const error = new Error('Network error')
      prisonerDetailsService.getDetails.mockRejectedValue(error)

      await expect(controller(req, res)).rejects.toThrowError(error)
      expect(res.locals.redirectUrl).toBe(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
      expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/${offenderNo}`)
    })
  })
})
