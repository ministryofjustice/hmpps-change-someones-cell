import express from 'express'
import searchForCellController from '../controllers/cellMove/searchForCell'
import selectCellController from '../controllers/cellMove/selectCell'
import considerRisksController from '../controllers/cellMove/considerRisks'

const router = express.Router({ mergeParams: true })

const controller = services => {
  const { index: considerRisksIndex, post: considerRisksPost } = considerRisksController(services)

  router.get('/search-for-cell', searchForCellController(services))
  router.get('/select-cell', selectCellController(services))
  router.get('/consider-risks', considerRisksIndex)
  router.post('/consider-risks', considerRisksPost)

  return router
}

export default dependencies => controller(dependencies)
