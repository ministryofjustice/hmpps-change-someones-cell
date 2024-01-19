import asyncMiddleware from '../middleware/asyncHandler'
import log from '../../logger'
import PrisonerDetailsService from '../services/prisonerDetailsService'

const placeHolderImagePath = '/assets/images/image-missing.jpg'

export const imageFactory = (prisonerDetailsService: PrisonerDetailsService) => {
  const image = asyncMiddleware(async (req, res) => {
    const { imageId } = req.params

    if (!imageId) {
      res.redirect(placeHolderImagePath)
    } else {
      prisonerDetailsService
        .getImage(res.locals.user.token, imageId)
        .then(data => {
          res.type('image/jpeg')
          data.pipe(res)
        })
        .catch(error => {
          // Not Found 404 is an acceptable response.
          // It has been logged as part of the client call,
          // no need to repeat here.
          if (error.status !== 404) {
            log.error(error)
          }
          res.redirect(placeHolderImagePath)
        })
    }
  })

  const prisonerImage = asyncMiddleware(async (req, res) => {
    const { offenderNo } = req.params
    const { fullSizeImage } = req.query

    if (!offenderNo || offenderNo === 'placeholder') {
      res.redirect(placeHolderImagePath)
    } else {
      prisonerDetailsService
        .getPrisonerImage(res.locals.user.token, offenderNo, fullSizeImage)
        .then(data => {
          res.set('Cache-control', 'private, max-age=86400')
          res.removeHeader('pragma')
          res.type('image/jpeg')
          data.pipe(res)
        })
        .catch(error => {
          // Not Found 404 is an acceptable response.
          // It has been logged as part of the client call,
          // no need to repeat here.
          if (error.status !== 404) {
            log.error(error)
          }
          res.redirect(placeHolderImagePath)
        })
    }
  })

  return {
    image,
    prisonerImage,
  }
}

export default {
  imageFactory,
}
