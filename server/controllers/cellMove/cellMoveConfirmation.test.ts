import cellMoveConfirmation from './cellMoveConfirmation'
import LocationService from '../../services/locationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'

jest.mock('../../services/locationService')
jest.mock('../../services/prisonerDetailsService')

describe('Cell move confirmation', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let controller
  const req = { params: { offenderNo: 'A12345' }, query: { cellId: 1 }, originalUrl: 'http://localhost' }
  let res

  const systemClientToken = 'system_token'

  beforeEach(() => {
    prisonerDetailsService.getDetails = jest
      .fn()
      .mockResolvedValue({ firstName: 'Bob', lastName: 'Doe', agencyId: 'MDI' })
    locationService.getLocation = jest.fn().mockResolvedValue({ description: 'A-1-012' })
    controller = cellMoveConfirmation({ locationService, prisonerDetailsService })

    res = {
      locals: {
        user: {
          activeCaseLoad: { caseLoadId: 'LEI' },
          allCaseloads: [{ caseLoadId: 'LEI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
      },
      status: jest.fn(),
      render: jest.fn(),
    }
  })

  it('should make a call to retrieve an offenders details', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345')
  })

  it('should make call to retrieve location details', async () => {
    await controller(req, res)

    expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 1)
  })

  it('should store correct redirect and home url then re-throw the error', async () => {
    const offenderNo = 'A12345'
    const error = new Error('network error')

    prisonerDetailsService.getDetails = jest.fn().mockRejectedValue(error)

    await expect(controller(req, res)).rejects.toThrow(error)

    expect(res.locals.redirectUrl).toBe(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
    expect(res.locals.homeUrl).toBe(`/prisoner/${offenderNo}`)
  })
})
