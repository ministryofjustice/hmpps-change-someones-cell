import { Request, Response } from 'express'
import config from '../config'

const returnUrl = (serviceName: string, serviceUrlParams: Record<string, string> = {}): string => {
  if (serviceName === 'prisonerProfile') {
    const { offenderNo } = serviceUrlParams

    if (!offenderNo) return config.prisonerProfileUrl

    return `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
  }

  return '/'
}

export default () => async (req: Request, res: Response) => {
  const { returnToService } = req.session
  delete req.session.returnToService

  const { serviceUrlParams } = req.query || {}

  return res.redirect(returnUrl(returnToService, serviceUrlParams as Record<string, string>))
}
