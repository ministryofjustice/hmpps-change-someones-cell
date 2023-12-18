import { Router } from 'express'
import auth from '../authentication/auth'
import tokenVerifier from '../data/tokenVerification'
import type { Services } from '../services'
import currentUser from './currentUser'

export default function setUpCurrentUser(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(auth.authenticationMiddleware(tokenVerifier))
  router.use(currentUser(services))
  return router
}
