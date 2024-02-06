import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'
import cellMoveViewResidentialLocation from '../controllers/cellMove/cellMoveViewResidentialLocation'
import cellMoveTemporaryMove from '../controllers/cellMove/cellMoveTemporaryMove'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch(services))
  router.get('/view-residential-location', cellMoveViewResidentialLocation(services))
  router.get('/temporary-move', cellMoveTemporaryMove(services))

  return router
}

export default controller
