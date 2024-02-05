import { putLastNameFirst, formatLocation } from '../../utils'
import { getBackLinkData } from './cellMoveUtils'
import getValueByType from '../../shared/getValueByType'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

type Params = {
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const {
        bookingId,
        firstName,
        lastName,
        age,
        religion,
        profileInformation,
        physicalAttributes,
        assignedLivingUnit,
      } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo, true)
      const mainOffence = await prisonerDetailsService.getMainOffence(systemClientToken, bookingId)
      const { ethnicity, raceCode } = physicalAttributes || {}

      return res.render('cellMove/offenderDetails.njk', {
        prisonerName: putLastNameFirst(firstName, lastName),
        cellLocation: formatLocation(assignedLivingUnit.description) || 'Not entered',
        offenderNo,
        age: age || 'Not entered',
        religion: religion || 'Not entered',
        ethnicity: (ethnicity && raceCode && `${ethnicity} (${raceCode})`) || 'Not entered',
        sexualOrientation: getValueByType('SEXO', profileInformation, 'resultValue') || 'Not entered',
        smokerOrVaper: getValueByType('SMOKE', profileInformation, 'resultValue') || 'Not entered',
        mainOffence: (mainOffence && mainOffence[0] && mainOffence[0].offenceDescription) || 'Not entered',
        ...getBackLinkData(req.headers.referer, offenderNo),
        profileUrl: `${config.prisonerProfileUrl}/prisoner/${offenderNo}`,
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `/prisoner/${offenderNo}`
      throw error
    }
  }
