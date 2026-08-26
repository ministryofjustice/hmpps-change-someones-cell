import { Prisoner } from '../../data/prisonerSearchApiClient'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import confirmation from './confirmationReception'

jest.mock('../../services/prisonerDetailsService')

const someOffenderNumber = 'A12345'

let res
let req
let controller

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

const systemClientToken = 'system_token'

describe('Reception move confirmation', () => {
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  beforeEach(() => {
    prisonerDetailsService.getPrisoner.mockResolvedValue(details)

    req = {
      params: {
        offenderNo: someOffenderNumber,
      },
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

    controller = confirmation({ prisonerDetailsService })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('page', () => {
    it('should make the correct api calls', async () => {
      await controller(req, res)
      expect(prisonerDetailsService.getPrisoner).toHaveBeenCalledWith(systemClientToken, someOffenderNumber)
    })

    it('should render with correct data', async () => {
      await controller(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/confirmation.njk',
        expect.objectContaining({
          offenderNo: 'A12345',
          confirmationMessage: 'Barry Jones has been moved to reception',
          profileUrl: 'http://localhost:3000/prisoner/A12345',
        }),
      )
    })
  })
})
