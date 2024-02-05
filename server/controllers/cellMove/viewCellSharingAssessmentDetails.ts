import moment from 'moment'
import { putLastNameFirst, hasLength } from '../../utils'
import { getBackLinkData, translateCsra } from './cellMoveUtils'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import LocationService from '../../services/locationService'

type Params = {
  locationService: LocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ locationService, prisonerDetailsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const [offenderDetails, assessments] = await Promise.all([
        prisonerDetailsService.getDetails(systemClientToken, offenderNo, true),
        prisonerDetailsService.getCsraAssessments(systemClientToken, [offenderNo]),
      ])

      const { firstName, lastName, assignedLivingUnit } = offenderDetails || {}

      const mostRecentAssessment =
        hasLength(assessments) && assessments.sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0]

      const location =
        mostRecentAssessment &&
        mostRecentAssessment.assessmentAgencyId &&
        (await locationService.getAgencyDetails(systemClientToken, mostRecentAssessment.assessmentAgencyId))

      return res.render('cellMove/cellSharingRiskAssessmentDetails.njk', {
        prisonerName: putLastNameFirst(firstName, lastName),
        cellLocation: (assignedLivingUnit && assignedLivingUnit.description) || 'Not entered',
        location: (location && location.description) || 'Not entered',
        level: mostRecentAssessment && translateCsra(mostRecentAssessment.classificationCode),
        date:
          (mostRecentAssessment &&
            mostRecentAssessment.assessmentDate &&
            moment(mostRecentAssessment.assessmentDate, 'YYYY-MM-DD').format('D MMMM YYYY')) ||
          'Not entered',
        comment: (mostRecentAssessment && mostRecentAssessment.assessmentComment) || 'Not entered',
        ...getBackLinkData(req.headers.referer, offenderNo),
      })
    } catch (error) {
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
      res.locals.homeUrl = `/prisoner/${offenderNo}`
      throw error
    }
  }
