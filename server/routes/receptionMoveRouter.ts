import express from 'express'
import considerRisksController from '../controllers/cellMove/considerRisksReception'
import confirmReceptionMoveController from '../controllers/cellMove/confirmReceptionMove'

const router = express.Router({ mergeParams: true })

const controller = services => {
  const { view: considerRisksView, submit: considerRisksPost } = considerRisksController(services)

  router.get('/consider-risks-reception', considerRisksView)
  router.post('/consider-risks-reception', considerRisksPost)

  const { view: confirmReceptionMoveView, post: confirmReceptionMovePost } = confirmReceptionMoveController(services)
  router.get('/confirm-reception-move', confirmReceptionMoveView)
  router.post('/confirm-reception-move', confirmReceptionMovePost)

  return router
}

export default dependencies => controller(dependencies)
