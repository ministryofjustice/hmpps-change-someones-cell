import { OffenderDetails } from '../../data/prisonApiClient'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import receptionFullController from './receptionFull'

jest.mock('../../services/prisonerDetailsService')

const someOffenderNumber = 'A12345'

let res
let req
let controller

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

const systemClientToken = 'system_token'

describe('Reception full', () => {
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  beforeEach(() => {
    prisonerDetailsService.getDetails.mockResolvedValue(details)

    req = {
      params: {
        offenderNo: someOffenderNumber,
      },
      session: { referrerUrl: 'refering-url' },
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

    controller = receptionFullController({ prisonerDetailsService })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('page', () => {
    it('should make the correct api calls', async () => {
      await controller(req, res)
      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, someOffenderNumber, false)
    })

    it('should render with correct data', async () => {
      await controller(req, res)
      expect(res.render).toHaveBeenCalledWith('receptionMove/receptionFull.njk', {
        offenderName: 'Barry Jones',
        offenderNo: 'A12345',
        backUrl: 'refering-url',
      })
    })
  })
})
