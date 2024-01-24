import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'
import searchForCellController from '../controllers/cellMove/searchForCell'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch(services))
  router.get('/search-for-cell', searchForCellController(services))

  return router
}

export default controller
