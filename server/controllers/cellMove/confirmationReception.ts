import { Request, Response } from 'express'
import { formatName } from '../../utils'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

type Params = {
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService }: Params) => {
  return async (req: Request, res: Response) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo, false)
    const profileUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
    const data = {
      confirmationMessage: `${formatName(firstName, lastName)} has been moved to reception`,
      profileUrl,
      offenderNo,
    }

    return res.render('receptionMove/confirmation.njk', data)
  }
}
