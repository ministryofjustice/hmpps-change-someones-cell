import moment from 'moment'
import { putLastNameFirst, formatName } from '../../utils'
import { getBackLinkData, getNonAssociationsInEstablishment } from './cellMoveUtils'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

type Params = {
  nonAssociationsService: NonAssociationsService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService, nonAssociationsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo)
      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)

      // Only show active non-associations in the same establishment
      // Active means the effective date is not in the future and the expiry date is not in the past
      const sortedNonAssociationsInEstablishment = (
        await getNonAssociationsInEstablishment(nonAssociations, systemClientToken, prisonerDetailsService)
      ).sort((left, right) => {
        if (left.effectiveDate < right.effectiveDate) return 1
        if (right.effectiveDate < left.effectiveDate) return -1
        if (left.offenderNonAssociation.lastName > right.offenderNonAssociation.lastName) return 1
        if (right.offenderNonAssociation.lastName > left.offenderNonAssociation.lastName) return -1
        return 0
      })

      const nonAssociationsRows = sortedNonAssociationsInEstablishment?.map(nonAssociation => ({
        name: putLastNameFirst(
          nonAssociation.offenderNonAssociation.firstName,
          nonAssociation.offenderNonAssociation.lastName,
        ),
        prisonNumber: nonAssociation.offenderNonAssociation.offenderNo,
        location: nonAssociation.offenderNonAssociation.assignedLivingUnitDescription,
        type: nonAssociation.typeDescription,
        selectedOffenderKey: `${formatName(firstName, lastName)} is`,
        selectedOffenderRole: nonAssociation.reasonDescription,
        otherOffenderKey: `${formatName(
          nonAssociation.offenderNonAssociation.firstName,
          nonAssociation.offenderNonAssociation.lastName,
        )} is`,
        otherOffenderRole: nonAssociation.offenderNonAssociation.reasonDescription,
        comment: nonAssociation.comments || 'None entered',
        effectiveDate: moment(nonAssociation.effectiveDate).format('D MMMM YYYY'),
      }))

      return res.render('cellMove/nonAssociations.njk', {
        nonAssociationsRows,
        breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
        prisonerName: formatName(firstName, lastName),
        searchForCellLink: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        offenderNo,
        ...getBackLinkData(req.session?.referrerUrl, offenderNo),
      })
    } catch (error) {
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
