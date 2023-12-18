import { Router } from 'express'

import type { Services } from '../services'
import changeSomeonesCellRouter from './changeSomeonesCellRouter'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(_service: Services): Router {
  const router = Router()

  router.use('/', changeSomeonesCellRouter({}))

  return router
}
