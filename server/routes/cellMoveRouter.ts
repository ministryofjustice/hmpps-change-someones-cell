import express from 'express'
import searchForCellController from '../controllers/cellMove/searchForCell'
import selectCellController from '../controllers/cellMove/selectCell'
import considerRisksController from '../controllers/cellMove/considerRisks'
import confirmCellMoveController from '../controllers/cellMove/confirmCellMove'
import cellMoveConfirmationController from '../controllers/cellMove/cellMoveConfirmation'
import spaceCreatedController from '../controllers/cellMove/spaceCreated'
import cellNotAvailable from '../controllers/cellMove/cellNotAvailable'
import offenderDetailsController from '../controllers/cellMove/viewOffenderDetails'
import cellSharingRiskAssessmentController from '../controllers/cellMove/viewCellSharingAssessmentDetails'
import nonAssociationsController from '../controllers/cellMove/viewNonAssociations'

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
  router.get('/confirmation', cellMoveConfirmationController(services))
  router.get('/space-created', spaceCreatedController(services))
  router.get('/cell-not-available', cellNotAvailable())
  router.get('/prisoner-details', offenderDetailsController(services))
  router.get('/cell-sharing-risk-assessment-details', cellSharingRiskAssessmentController(services))
  router.get('/non-associations', nonAssociationsController(services))

  return router
}

export default dependencies => controller(dependencies)
