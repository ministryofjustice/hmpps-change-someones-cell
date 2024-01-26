import express from 'express'
import searchForCellController from '../controllers/cellMove/searchForCell'
import selectCellController from '../controllers/cellMove/selectCell'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/search-for-cell', searchForCellController(services))
  router.get('/select-cell', selectCellController(services))

  return router
}

export default dependencies => controller(dependencies)
