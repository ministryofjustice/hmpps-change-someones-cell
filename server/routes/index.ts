import { Router } from 'express'

import type { Services } from '../services'
import changeSomeonesCellRouter from './changeSomeonesCellRouter'
import cellMoveRouter from './cellMoveRouter'
import backToStart from '../controllers/backToStart'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  router.use('/', changeSomeonesCellRouter(services))

  router.use('/prisoner/:offenderNo/cell-move', cellMoveRouter(services))

  router.get('/back-to-start', backToStart())

  return router
}
