import express from 'express'
import considerRisksController from '../controllers/cellMove/considerRisksReception'

const router = express.Router({ mergeParams: true })

const controller = services => {
  const { view: considerRiskView, submit: considerRiskSubmit } = considerRisksController(services)

  router.get('/consider-risks-reception', considerRiskView)
  router.post('/consider-risks-reception', considerRiskSubmit)

  return router
}

export default dependencies => controller(dependencies)
