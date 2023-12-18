import express from 'express'
import cellMoveHomepage from '../controllers/cellMove/cellMoveHomepage'

const router = express.Router({ mergeParams: true })

const controller = (_dependencies: any) => {
  router.get('/', cellMoveHomepage)

  return router
}

export default (dependencies: any) => controller(dependencies)
