import { RequestHandler } from 'express'
import logger from '../../logger'
import { dataAccess } from '../data'

export default function populateClientToken(): RequestHandler {
  return async (_req, res, next) => {
    try {
      const { hmppsAuthClient } = dataAccess()
      if (res.locals.user) {
        const clientToken = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        if (clientToken) {
          res.locals.systemClientToken = clientToken
        } else {
          logger.info('No client token available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve client token for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
