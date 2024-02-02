import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'
import cellMoveViewResidentialLocation from '../controllers/cellMove/cellMoveViewResidentialLocation'

const router = express.Router({ mergeParams: true })

const controller = services => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch(services))
  router.get('/view-residential-location', cellMoveViewResidentialLocation(services))

  return router
}

export default controller
