import { jwtDecode } from 'jwt-decode'
import logger from '../../logger'
import { forenameToInitial } from '../utils'
import { Services } from '../services'
import { CaseLoad } from '../data/prisonApiClient'
import { FeComponentsMeta } from '../data/feComponentsClient'

export type User = {
  allCaseloads: CaseLoad[]
  displayName: string
  activeCaseLoad?: CaseLoad
}

export default ({ userService }: Services) => {
  const getUserRoles = async (req, res) => {
    try {
      const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }
      if (!roles) {
        logger.info('No user roles available')
      }
      return roles
    } catch (error) {
      logger.warn(error, 'Failed to retrieve roles')
    }
    return null
  }

  return async (req, res, next) => {
    try {
      const userDetails = res.locals.user && (await userService.getUser(res.locals.user.token))

      const feMeta: FeComponentsMeta = res.locals.feComponents?.meta

      const allCaseloads = feMeta ? feMeta.caseLoads : await userService.userCaseLoads(res.locals.user.token)
      const activeCaseLoad = feMeta
        ? feMeta.activeCaseLoad
        : allCaseloads.find(cl => cl.caseLoadId === userDetails.activeCaseLoadId)

      const userRoles = await getUserRoles(req, res)

      const user: User = {
        ...res.locals.user,
        username: userDetails.username,
        userRoles,
        allCaseloads,
        displayName: forenameToInitial(userDetails.name as any),
        activeCaseLoad,
        activeCaseLoadId: userDetails.activeCaseLoadId,
        backLink: req.session.userBackLink,
      }

      res.locals.user = user

      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve details user for: ${res.locals.user?.username}`)
      next(error)
    }
  }
}
