import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'
import cellMovePrisonerSearch from '../controllers/cellMove/cellMovePrisonerSearch'

const router = express.Router({ mergeParams: true })

const controller = ({ systemOauthClient, prisonApi }) => {
  router.get('/', cellMoveHomepage)
  router.get('/prisoner-search', cellMovePrisonerSearch({ systemOauthClient, prisonApi }))

  return router
}

export default controller
