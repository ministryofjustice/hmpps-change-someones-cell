import moment from 'moment'
import { putLastNameFirst, formatName } from '../../utils'
import { getBackLinkData, getNonAssociationsInEstablishment } from './cellMoveUtils'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

type Params = {
  nonAssociationsService: NonAssociationsService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerDetailsService, nonAssociationsService }: Params) =>
  async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    try {
      const { firstName, lastName } = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)
      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)

      const sortedNonAssociationsInEstablishment = getNonAssociationsInEstablishment(nonAssociations)

      const nonAssociationsRows = sortedNonAssociationsInEstablishment?.map(nonAssociation => ({
        name: putLastNameFirst(
          nonAssociation.otherPrisonerDetails.firstName,
          nonAssociation.otherPrisonerDetails.lastName,
        ),
        prisonNumber: nonAssociation.otherPrisonerDetails.prisonerNumber,
        location: nonAssociation.otherPrisonerDetails.cellLocation,
        reason: nonAssociation.reasonDescription,
        type: nonAssociation.restrictionTypeDescription,
        selectedOffenderKey: `${formatName(firstName, lastName)} is`,
        selectedOffenderRole: nonAssociation.roleDescription,
        otherOffenderKey: `${formatName(
          nonAssociation.otherPrisonerDetails.firstName,
          nonAssociation.otherPrisonerDetails.lastName,
        )} is`,
        otherOffenderRole: nonAssociation.otherPrisonerDetails.roleDescription,
        comment: nonAssociation.comment || 'None entered',
        effectiveDate: moment(nonAssociation.whenCreated).format('D MMMM YYYY'),
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
