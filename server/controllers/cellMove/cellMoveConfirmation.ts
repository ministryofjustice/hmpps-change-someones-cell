import config from '../../config'
import LocationService from '../../services/locationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { formatName } from '../../utils'

type Params = {
  locationService: LocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ locationService, prisonerDetailsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const { cellId } = req.query
      const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo)
      const { pathHierarchy } = await locationService.getLocation(systemClientToken, cellId)

      return res.render('cellMove/confirmation.njk', {
        backToStartUrl: `/back-to-start?serviceUrlParams[offenderNo]=${offenderNo}`,
        confirmationMessage: `${formatName(firstName, lastName)} has been moved to cell ${pathHierarchy}`,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
