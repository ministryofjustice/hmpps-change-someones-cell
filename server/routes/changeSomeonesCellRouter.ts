import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch(services))

  return router
}

export default controller
