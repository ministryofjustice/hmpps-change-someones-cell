import express from 'express'
import searchForCellController from '../controllers/cellMove/searchForCell'
import selectCellController from '../controllers/cellMove/selectCell'
import considerRisksController from '../controllers/cellMove/considerRisks'
import confirmCellMoveController from '../controllers/cellMove/confirmCellMove'

const router = express.Router({ mergeParams: true })

const controller = services => {
  const { index: considerRisksIndex, post: considerRisksPost } = considerRisksController(services)
  const { index: confirmCellMoveIndex, post: confirmCellMovePost } = confirmCellMoveController(services)

  router.get('/search-for-cell', searchForCellController(services))
  router.get('/select-cell', selectCellController(services))
  router.get('/consider-risks', considerRisksIndex)
  router.post('/consider-risks', considerRisksPost)
  router.get('/confirm-cell-move', confirmCellMoveIndex)
  router.post('/confirm-cell-move', confirmCellMovePost)

  return router
}

export default dependencies => controller(dependencies)
