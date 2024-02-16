import { Request, Response } from 'express'
import { formatName } from '../../utils'
import PrisonerDetailsService from '../../services/prisonerDetailsService'

type Params = {
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService }: Params) => {
  return async (req: Request, res: Response) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo, false)
    const data = {
      offenderName: formatName(firstName, lastName),
      offenderNo,
      backUrl: req.headers.referer,
    }

    return res.render('receptionMove/receptionFull.njk', data)
  }
}
