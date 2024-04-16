import express from 'express'
import 'express-async-errors'

import createError from 'http-errors'
import cookieParser from 'cookie-parser'

import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import authorisationMiddleware from './middleware/authorisationMiddleware'
import { metricsMiddleware } from './monitoring/metricsApp'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpCurrentUser from './middleware/setUpCurrentUser'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setUpWebSession from './middleware/setUpWebSession'
import getFrontendComponents from './middleware/getFeComponents'
import populateClientToken from './middleware/populateClientToken'

import routes from './routes'
import type { Services } from './services'
import setupApiRoutes from './setupApiRoutes'
import returnToService from './middleware/returnToService'
import referrerUrl from './middleware/referrerUrl'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  app.use(metricsMiddleware)
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(cookieParser())
  app.use(setUpStaticResources())
  nunjucksSetup(app, services.applicationInfo)
  app.use(setUpAuthentication())
  app.use(authorisationMiddleware(['ROLE_CELL_MOVE']))
  app.use(setUpCsrf())
  app.get('*', getFrontendComponents(services))
  app.use(setUpCurrentUser(services))
  app.use(populateClientToken())
  app.use(returnToService())
  app.use(referrerUrl())
  app.use(setupApiRoutes(services))

  app.use(routes(services))

  app.use((_req, _res, next) => next(createError(404, 'Not found')))
  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
