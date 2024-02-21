import config from '../../config'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { properCaseName } from '../../utils'

type Params = {
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo)

      return res.render('cellMove/spaceCreated.njk', {
        title: `${properCaseName(firstName)} ${properCaseName(lastName)} has been moved`,
        name: `${properCaseName(firstName)} ${properCaseName(lastName)}`,
        prisonerSearchLink: '/prisoner-search',
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
