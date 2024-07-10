import { alertFlagLabels, cellMoveAlertCodes } from '../../shared/alertFlagValues'
import { putLastNameFirst, formatName, formatLocation, hasLength } from '../../utils'
import { getNonAssociationsInEstablishment, translateCsra, userHasAccess } from './cellMoveUtils'
import logger from '../../../logger'
import { logError } from '../../logError'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

type Params = {
  nonAssociationsService: NonAssociationsService
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ nonAssociationsService, prisonerCellAllocationService, prisonerDetailsService }: Params) => {
  const view = async (req, res) => {
    const { offenderNo } = req.params
    const { systemClientToken, user } = res.locals
    const { allCaseloads: userCaseLoads, userRoles, activeCaseLoadId } = user

    try {
      const [prisonerDetails, assessments] = await Promise.all([
        prisonerDetailsService.getDetails(systemClientToken, offenderNo, true),
        prisonerDetailsService.getCsraAssessments(systemClientToken, [offenderNo]),
      ])

      const receptionOccupancy = await prisonerCellAllocationService.getReceptionsWithCapacity(
        systemClientToken,
        prisonerDetails.agencyId,
      )

      if (!receptionOccupancy.length) {
        logger.info('Can not move to reception as already full to capacity')
        return res.redirect(`/prisoner/${offenderNo}/reception-move/reception-full`)
      }

      if (!userHasAccess({ userRoles, userCaseLoads, offenderCaseload: prisonerDetails.agencyId })) {
        logger.info('User does not have correct roles')
        return res.render('notFound.njk', { url: '/prisoner-search' })
      }

      const displayLinkToPrisonersMostRecentCsra =
        hasLength(assessments) &&
        assessments.sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate))[0].assessmentComment

      const nonAssociations = await nonAssociationsService.getNonAssociations(systemClientToken, offenderNo)

      const prisonersActiveAlertCodes = prisonerDetails.alerts
        .filter(alert => !alert.expired)
        .map(alert => alert.alertCode)

      const prisonerAlerts = alertFlagLabels.filter(alertFlag =>
        alertFlag.alertCodes.some(
          alert => prisonersActiveAlertCodes.includes(alert) && cellMoveAlertCodes.includes(alert),
        ),
      )

      const prisonerDetailsWithFormattedLocation = {
        ...prisonerDetails,
        assignedLivingUnit: {
          ...prisonerDetails.assignedLivingUnit,
          description: formatLocation(prisonerDetails.assignedLivingUnit.description),
        },
      }

      const offenderNumbersOfAllNonAssociations = nonAssociations.nonAssociations.map(
        offender => offender.otherPrisonerDetails.prisonerNumber,
      )
      const offendersInReception = await prisonerCellAllocationService.getOffendersInReception(
        systemClientToken,
        activeCaseLoadId,
      )
      const offenderNumbersOfAllInReception = offendersInReception.map(offender => offender.offenderNo)

      let offenderCsraStatus = []

      if (offenderNumbersOfAllInReception.length > 0) {
        offenderCsraStatus = await prisonerDetailsService.getCsraAssessments(
          systemClientToken,
          offenderNumbersOfAllInReception,
        )
      }

      const otherOffenders = offendersInReception
        .sort((left, right) => left.lastName.localeCompare(right.lastName, 'en', { ignorePunctuation: true }))
        .map(offender => ({
          offenderNo: offender.offenderNo,
          name: putLastNameFirst(offender.firstName, offender.lastName),
          nonAssociation: offenderNumbersOfAllNonAssociations.includes(offender.offenderNo),
          csraClassification:
            offenderCsraStatus.find(statuses => statuses.offenderNo === offender.offenderNo)?.classification ||
            'Not entered',
          displayCsraLink: offenderCsraStatus.find(statuses => statuses.offenderNo === offender.offenderNo)
            ?.assessmentComment,
          alerts: offender.alerts
            .map(alertCode => alertFlagLabels.find(alertLabel => alertLabel.alertCodes.includes(alertCode)))
            .filter(Boolean)
            .map(alertLabel => ({ classes: alertLabel.classes, label: alertLabel.label }))
            .sort((left, right) => left.label.localeCompare(right.label, 'en', { ignorePunctuation: true })),
        }))

      const nonAssociationsInEstablishment = getNonAssociationsInEstablishment(nonAssociations)
      const sortedNonAssociationsInReceptionWithinCurrentEstablishment = nonAssociationsInEstablishment.filter(
        nonAssociationPrisoner =>
          offenderNumbersOfAllInReception.includes(nonAssociationPrisoner.otherPrisonerDetails.prisonerNumber),
      )

      const { firstName, lastName } = await prisonerDetailsService.getDetails(systemClientToken, offenderNo)

      const nonAssociationsRows = sortedNonAssociationsInReceptionWithinCurrentEstablishment?.map(nonAssociation => ({
        name: putLastNameFirst(
          nonAssociation.otherPrisonerDetails.firstName,
          nonAssociation.otherPrisonerDetails.lastName,
        ),
        prisonNumber: nonAssociation.otherPrisonerDetails.prisonerNumber,
        type: nonAssociation.reasonDescription,
        selectedOffenderKey: `${formatName(firstName, lastName)} is`,
        selectedOffenderRole: nonAssociation.roleDescription,
        otherOffenderKey: `${formatName(
          nonAssociation.otherPrisonerDetails.firstName,
          nonAssociation.otherPrisonerDetails.lastName,
        )} is`,
        otherOffenderRole: nonAssociation.otherPrisonerDetails.roleDescription,
        comment: nonAssociation.comment || 'Not entered',
      }))

      const personOrPeople = otherOffenders.length === 1 ? 'person' : 'people'
      const inReceptionCount = `${otherOffenders.length} ${personOrPeople} in reception`

      return res.render('receptionMove/considerRisksReception.njk', {
        reverseOrderPrisonerName: putLastNameFirst(prisonerDetails.firstName, prisonerDetails.lastName).trim(),
        prisonerName: formatName(prisonerDetails.firstName, prisonerDetails.lastName),
        prisonerAlerts,
        prisonerDetails: prisonerDetailsWithFormattedLocation,
        nonAssociationLink: `/prisoner/${offenderNo}/cell-move/non-associations`,
        searchForCellRootUrl: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        offenderDetailsUrl: `/prisoner/${offenderNo}/cell-move/prisoner-details`,
        csraDetailsUrl: `/prisoner/${offenderNo}/cell-move/cell-sharing-risk-assessment-details`,
        displayLinkToPrisonersMostRecentCsra,
        convertedCsra: translateCsra(prisonerDetails.csraClassificationCode),
        backUrl: `${config.prisonerProfileUrl}/prisoner/${offenderNo}/location-details`,
        hasNonAssociations: nonAssociationsInEstablishment?.length > 0,
        nonAssociationsRows,
        offendersInReception: otherOffenders,
        inReceptionCount,
        errors: req.flash('errors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, 'error getting consider-risks-reception')
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }

  const submit = async (req, res) => {
    const { offenderNo } = req.params
    const { considerRisksReception } = req.body

    if (!considerRisksReception) {
      const errors = []
      errors.push({ href: '#considerRisksReception', text: 'Select yes or no' })
      req.flash('errors', errors)
      return res.redirect(`/prisoner/${offenderNo}/reception-move/consider-risks-reception`)
    }

    if (considerRisksReception === 'yes') {
      return res.redirect(`/prisoner/${offenderNo}/reception-move/confirm-reception-move`)
    }
    return res.redirect(`${config.prisonerProfileUrl}/prisoner/${offenderNo}/location-details`)
  }

  return { view, submit }
}
