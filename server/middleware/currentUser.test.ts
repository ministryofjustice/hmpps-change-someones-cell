import createError from 'http-errors'
import currentUser from './currentUser'
import { UserService, Services } from '../services'
import logger from '../../logger'

jest.mock('../../logger')

const userService = new UserService(null, null) as jest.Mocked<UserService>

describe('Current user', () => {
  let res
  let req
  let next
  let controller

  const allCaseloads = [
    {
      caseLoadId: 'MDI',
      currentlyActive: true,
      description: 'Moorland',
    },
    {
      caseLoadId: 'XYZ',
      currentlyActive: false,
      description: 'Another HMP',
    },
    {
      caseLoadId: 'STI',
      currentlyActive: false,
      description: 'Styal (HMP & YOI)',
    },
  ]

  beforeEach(() => {
    req = { session: { allCaseloads: [] } }
    res = { session: {}, locals: { user: { token: 'token-1', username: 'Jim' } } }
    next = jest.fn()

    controller = currentUser({ userService } as unknown as Services)
  })

  it('should set user details correctly - happy path', async () => {
    userService.getUser = jest.fn().mockResolvedValue({
      username: 'Some_username',
      name: 'Jim Smith',
      active: true,
      userId: '123456',
      activeCaseLoadId: 'MDI',
    })

    res.locals.feComponents = {
      meta: {
        activeCaseLoad: {
          caseLoadId: 'MDI',
          description: 'Moorland',
          currentlyActive: true,
        },
        caseLoads: allCaseloads,
      },
    }
    req.session.userBackLink = 'SomeUserBackLink'

    userService.userCaseLoads = jest.fn()

    await controller(req, res, next)

    expect(userService.userCaseLoads).not.toHaveBeenCalled()

    expect(res.locals.user).toEqual({
      activeCaseLoad: {
        caseLoadId: 'MDI',
        currentlyActive: true,
        description: 'Moorland',
      },
      activeCaseLoadId: 'MDI',
      allCaseloads,
      backLink: 'SomeUserBackLink',
      displayName: 'J. Smith',
      token: 'token-1',
      userRoles: null,
      username: 'Some_username',
    })
  })
  it('should set user details correctly with undefined feMeta', async () => {
    userService.getUser = jest.fn().mockResolvedValue({
      username: 'Some_username',
      name: 'Jim Smith',
      active: true,
      userId: '123456',
      activeCaseLoadId: 'MDI',
    })

    res.locals.feComponents = undefined
    req.session.userBackLink = 'SomeUserBackLink'

    userService.userCaseLoads = jest.fn().mockResolvedValue(allCaseloads)

    await controller(req, res, next)

    expect(res.locals.user).toEqual({
      activeCaseLoad: {
        caseLoadId: 'MDI',
        currentlyActive: true,
        description: 'Moorland',
      },
      activeCaseLoadId: 'MDI',
      allCaseloads,
      backLink: 'SomeUserBackLink',
      displayName: 'J. Smith',
      token: 'token-1',
      userRoles: null,
      username: 'Some_username',
    })
  })

  it('should catch error', async () => {
    userService.getUser = jest.fn().mockRejectedValue(createError(500, 'Internal Server Error'))
    userService.userCaseLoads = jest.fn().mockResolvedValue([])
    const error = new Error('Internal Server Error')

    await controller(req, res, next)

    expect(req.session.userDetails).toEqual(undefined)
    expect(logger.error).toHaveBeenCalledWith(error, 'Failed to retrieve details user for: Jim')
    expect(next).toHaveBeenCalledWith(error)
  })
})
