import express from 'express'
import searchForCellController from '../controllers/cellMove/searchForCell'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/search-for-cell', searchForCellController(services))

  return router
}

export default dependencies => controller(dependencies)
