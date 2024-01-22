import express from 'express'

import { imageFactory } from './controllers/images'
import PrisonerDetailsService from './services/prisonerDetailsService'

const router = express.Router()

type Params = {
  prisonerDetailsService: PrisonerDetailsService
}

export const setup = ({ prisonerDetailsService }: Params) => {
  router.get('/app/images/:offenderNo/data', imageFactory(prisonerDetailsService).prisonerImage)

  return router
}

export default dependencies => setup(dependencies)
