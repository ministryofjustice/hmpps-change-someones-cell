import express from 'express'

import { imageFactory } from './controllers/images'

const router = express.Router()

export const setup = ({ prisonApi }) => {
  router.get('/app/images/:offenderNo/data', imageFactory(prisonApi).prisonerImage)

  return router
}

export default dependencies => setup(dependencies)
