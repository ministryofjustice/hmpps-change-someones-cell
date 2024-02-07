import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'
import cellMoveViewResidentialLocation from '../controllers/cellMove/cellMoveViewResidentialLocation'
import cellMoveTemporaryMove from '../controllers/cellMove/cellMoveTemporaryMove'
import recentCellMoves from '../controllers/cellMove/recentCellMoves'
import cellMoveHistory from '../controllers/cellMove/cellMoveHistory'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch(services))
  router.get('/view-residential-location', cellMoveViewResidentialLocation(services))
  router.get('/temporary-move', cellMoveTemporaryMove(services))
  router.get('/recent-cell-moves', recentCellMoves(services))
  router.get('/recent-cell-moves/history', cellMoveHistory(services))

  return router
}

export default controller
