import config from '../../config'
import LocationService from '../../services/locationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'
import { putLastNameFirst, formatName, formatLocation } from '../../utils'

import {
  userHasAccess,
  getNonAssociationsInEstablishment,
  renderLocationOptions,
  cellAttributes,
  translateCsra,
} from './cellMoveUtils'

type Params = {
  locationService: LocationService
  nonAssociationsService: NonAssociationsService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ locationService, nonAssociationsService, prisonerDetailsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params

    try {
      const { systemClientToken, user } = res.locals
      const { userRoles, allCaseloads: userCaseLoads } = user

      const prisonerDetails = await prisonerDetailsService.getDetails(systemClientToken, offenderNo, true)

      if (!userHasAccess({ userRoles, userCaseLoads, offenderCaseload: prisonerDetails.agencyId })) {
        return res.render('notFound.njk', { url: '/prisoner-search' })
      }

      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)
      const locationsData = await locationService.searchGroups(systemClientToken, prisonerDetails.agencyId)

      const prisonersActiveAlertCodes = prisonerDetails.alerts
        .filter(alert => !alert.expired)
        .map(alert => alert.alertCode)
      const alertsToShow = alertFlagLabels.filter(alertFlag =>
        alertFlag.alertCodes.some(
          alert => prisonersActiveAlertCodes.includes(alert) && cellMoveAlertCodes.includes(alert),
        ),
      )
      const numberOfNonAssociations = (
        await getNonAssociationsInEstablishment(nonAssociations, systemClientToken, prisonerDetailsService)
      ).length

      const prisonerDetailsWithFormattedLocation = {
        ...prisonerDetails,
        assignedLivingUnit: {
          ...prisonerDetails.assignedLivingUnit,
          description: formatLocation(prisonerDetails.assignedLivingUnit.description),
        },
      }

      let backUrl = req.session?.referrerUrl
      // If the referrer is a later page in the journey (i.e. the user already clicked back to get here), make the back
      // link point to the prisoner search page instead
      if (!backUrl || backUrl.endsWith('/cell-move/select-cell') || backUrl.endsWith('/cell-move/confirm-cell-move')) {
        backUrl = '/prisoner-search'
      }

      return res.render('cellMove/searchForCell.njk', {
        breadcrumbPrisonerName: putLastNameFirst(prisonerDetails.firstName, prisonerDetails.lastName),
        prisonerName: formatName(prisonerDetails.firstName, prisonerDetails.lastName),
        numberOfNonAssociations,
        showNonAssociationsLink: numberOfNonAssociations > 0,
        alerts: alertsToShow,
        locations: renderLocationOptions(locationsData),
        cellAttributes,
        prisonerDetails: prisonerDetailsWithFormattedLocation,
        offenderNo,
        nonAssociationLink: `/prisoner/${offenderNo}/cell-move/non-associations`,
        searchForCellRootUrl: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        offenderDetailsUrl: `/prisoner/${offenderNo}/cell-move/prisoner-details`,
        csraDetailsUrl: `/prisoner/${offenderNo}/cell-move/cell-sharing-risk-assessment-details`,
        formAction: `/prisoner/${offenderNo}/cell-move/select-cell`,
        profileUrl: `${config.prisonerProfileUrl}/prisoner/${offenderNo}`,
        convertedCsra: translateCsra(prisonerDetails.csraClassificationCode),
        backUrl,
      })
    } catch (error) {
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
