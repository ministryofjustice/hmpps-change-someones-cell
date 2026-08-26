import spaceCreatedController from './spaceCreated'
import { Prisoner } from '../../data/prisonerSearchApiClient'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

jest.mock('../../services/prisonerDetailsService')

describe('Space created', () => {
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  let req
  let res
  let controller

  const systemClientToken = 'system_token'
  const offenderNo = 'ABC123'

  const details: Prisoner = {
    prisonerNumber: 'A1234',
    firstName: 'Barry',
    lastName: 'Jones',
    gender: 'Male',
    prisonId: 'MDI',
    prisonName: 'Moorland (HMP)',
    cellLocation: '1-1-001',
    alerts: [],
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
      prisonerDetailsService.getPrisoner.mockResolvedValue(details)
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
      prisonerDetailsService.getPrisoner.mockRejectedValue(error)

      await expect(controller(req, res)).rejects.toThrow(error)
      expect(res.locals.redirectUrl).toBe(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
      expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/${offenderNo}`)
    })
  })
})
