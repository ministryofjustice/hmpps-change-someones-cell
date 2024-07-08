import moment from 'moment'
import { cellMoveAlertCodes } from '../../shared/alertFlagValues'

import { putLastNameFirst, formatName, indefiniteArticle, hasLength, createStringFromList } from '../../utils'

import getValueByType from '../../shared/getValueByType'
import { translateCsra } from './cellMoveUtils'
import AnalyticsService from '../../services/analyticsService'
import LocationService from '../../services/locationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import NonAssociationsService from '../../services/nonAssociationsService'
import logger from '../../../logger'
import config from '../../config'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

const activeCellMoveAlertsExcludingDisabled = alert =>
  !alert.expired && cellMoveAlertCodes.includes(alert.alertCode) && alert.alertCode !== 'PEEP'

const missingDataString = 'not entered'

type Params = {
  analyticsService: AnalyticsService
  locationService: LocationService
  prisonerDetailsService: PrisonerDetailsService
  nonAssociationsService: NonAssociationsService
  prisonerCellAllocationService: PrisonerCellAllocationService
}

export default ({
  analyticsService,
  locationService,
  nonAssociationsService,
  prisonerDetailsService,
  prisonerCellAllocationService,
}: Params) => {
  const getOccupantsDetails = async (context, offenders) =>
    Promise.all(offenders.map(offender => prisonerDetailsService.getDetails(context, offender, true)))

  const alertString = alertDescription => `${indefiniteArticle(alertDescription)} ${alertDescription} alert`

  const getOffenderAlertBody = (alert, title) => ({
    title,
    comment: alert.comment,
    date: `Date added: ${moment(alert.dateCreated, 'YYYY-MM-DD').format('D MMMM YYYY')}`,
  })

  const renderTemplate = async (req, res, pageData) => {
    const { offenderNo } = req.params
    const { cellId } = req.query
    const { errors } = pageData || {}

    const { systemClientToken } = res.locals
    try {
      const [currentOffenderDetails, occupants] = await Promise.all([
        prisonerDetailsService.getDetails(systemClientToken, offenderNo, true),
        prisonerCellAllocationService.getInmatesAtLocation(systemClientToken, cellId),
      ])
      const hasOccupants = occupants.length > 0
      const currentOccupants = occupants.flatMap(occupant => occupant.prisoners)
      const currentOccupantsOffenderNos = currentOccupants.map(occupant => occupant.prisonerNumber)
      const currentOccupantsDetails =
        occupants && (await getOccupantsDetails(systemClientToken, currentOccupantsOffenderNos))
      const locationDetail = await locationService.getLocation(systemClientToken, cellId)
      let nonAssociationsWithinLocation = []

      if (locationDetail.parentId) {
        const [topLevel, firstChild] = cellId.split('-')
        const locationPrefix = `${topLevel}-${firstChild}`
        // Get non-associations for the offender and filter them down to ones
        // that are currently in the same residential unit as the selected cell
        const currentOffenderNonAssociations = await nonAssociationsService.getNonAssociations(
          systemClientToken,
          offenderNo,
        )
        nonAssociationsWithinLocation =
          currentOffenderNonAssociations?.nonAssociations?.filter(
            nonAssociation =>
              nonAssociation.offenderNonAssociation.assignedLivingUnitDescription?.includes(locationPrefix),
          ) || []
      }
      const currentOffenderWithOccupants = [currentOffenderDetails, ...currentOccupantsDetails]

      const offendersCsraValues = currentOffenderWithOccupants
        .filter(currentOccupant => currentOccupant.csraClassificationCode)
        .map(currentOccupant => translateCsra(currentOccupant.csraClassificationCode))

      const showOffendersNamesWithCsra = hasOccupants && offendersCsraValues.includes('High')

      const currentOccupantsFormattedNames = currentOccupantsDetails.map(({ firstName, lastName }) =>
        formatName(firstName, lastName),
      )

      const offendersFormattedNamesWithCsra = currentOffenderWithOccupants.map(
        ({ firstName, lastName, csraClassificationCode }) =>
          `${formatName(firstName, lastName)} is CSRA ${translateCsra(csraClassificationCode)}.`,
      )

      const currentOffenderName = formatName(currentOffenderDetails.firstName, currentOffenderDetails.lastName)

      // Get a list of sexualities involved
      const currentOffenderSexuality =
        getValueByType('SEXO', currentOffenderDetails.profileInformation, 'resultValue') || missingDataString
      const currentOffenderIsNonHetero = !currentOffenderSexuality?.toLowerCase().includes('hetero')

      const currentNonHeteroOccupants = currentOccupantsDetails.filter(
        currentOccupant =>
          !getValueByType('SEXO', currentOccupant.profileInformation, 'resultValue')?.toLowerCase().includes('hetero'),
      )

      const currentNonHeteroOccupantsWithName = currentNonHeteroOccupants.map(
        currentOccupant =>
          `${formatName(currentOccupant.firstName, currentOccupant.lastName)} has a sexual orientation of ${
            getValueByType('SEXO', currentOccupant.profileInformation, 'resultValue') || missingDataString
          }`,
      )

      // Get the list of relevant offender alerts
      const currentOffenderActiveAlerts =
        currentOccupantsDetails.length > 0 &&
        currentOffenderDetails.alerts
          .filter(activeCellMoveAlertsExcludingDisabled)
          .filter(alert => alert.alertCode !== 'RLG' || (alert.alertCode === 'RLG' && currentNonHeteroOccupants.length))
          .map(alert => {
            const title =
              alert.alertCode === 'RLG' && currentNonHeteroOccupants.length
                ? `${alertString(alert.alertCodeDescription)} and ${createStringFromList(
                    currentNonHeteroOccupantsWithName,
                  )}`
                : `${alertString(alert.alertCodeDescription)}`

            return getOffenderAlertBody(alert, title)
          })

      const currentOccupantsWithFormattedActiveAlerts = currentOccupantsDetails
        .map(currentOccupant => ({
          name: formatName(currentOccupant.firstName, currentOccupant.lastName),
          alerts: currentOccupant.alerts
            .filter(activeCellMoveAlertsExcludingDisabled)
            .filter(alert => alert.alertCode !== 'RLG' || (alert.alertCode === 'RLG' && currentOffenderIsNonHetero))
            .map(alert => {
              const title =
                alert.alertCode === 'RLG' && currentOffenderIsNonHetero
                  ? `${alertString(
                      alert.alertCodeDescription,
                    )} and ${currentOffenderName} has a sexual orientation of ${currentOffenderSexuality}`
                  : `${alertString(alert.alertCodeDescription)}`

              return getOffenderAlertBody(alert, title)
            }),
        }))
        .filter(occupant => occupant.alerts.length)

      const currentOccupantsWithCatRating = currentOccupantsDetails.map(
        ({ firstName, lastName, categoryCode = missingDataString }) =>
          `${formatName(firstName, lastName)} is a Cat ${categoryCode}`,
      )

      const categoryWarning =
        currentOccupantsDetails.length > 0 &&
        currentOffenderDetails.categoryCode === 'A' &&
        `a Cat A rating and ${createStringFromList(currentOccupantsWithCatRating)}`

      if (
        !categoryWarning &&
        !showOffendersNamesWithCsra &&
        !hasLength(nonAssociationsWithinLocation) &&
        !hasLength(currentOffenderActiveAlerts) &&
        !hasLength(currentOccupantsWithFormattedActiveAlerts)
      ) {
        return res.redirect(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=${cellId}`)
      }

      return res.render('cellMove/considerRisks.njk', {
        offenderNo,
        currentOffenderName,
        prisonerNameForBreadcrumb: putLastNameFirst(currentOffenderDetails.firstName, currentOffenderDetails.lastName),
        profileUrl: `${config.prisonerProfileUrl}/prisoner/${offenderNo}`,
        selectCellUrl: `/prisoner/${offenderNo}/cell-move/select-cell`,
        showOffendersNamesWithCsra,
        confirmationQuestionLabel: hasOccupants
          ? `Are you sure you want to move ${currentOffenderName} into a cell with ${createStringFromList(
              currentOccupantsFormattedNames,
            )}?`
          : 'Are you sure you want to select this cell?',
        offendersFormattedNamesWithCsra,
        nonAssociations: nonAssociationsWithinLocation.map(nonAssociation => ({
          name: `${putLastNameFirst(
            nonAssociation.offenderNonAssociation.firstName,
            nonAssociation.offenderNonAssociation.lastName,
          )}`,
          prisonNumber: nonAssociation.offenderNonAssociation.offenderNo,
          location:
            nonAssociation.offenderNonAssociation.assignedLivingUnitDescription ||
            nonAssociation.offenderNonAssociation.agencyDescription,
          type: nonAssociation.typeDescription,
          reason: nonAssociation.offenderNonAssociation.reasonDescription,
          comment: nonAssociation.comments || 'None entered',
        })),
        currentOffenderActiveAlerts,
        currentOccupantsWithFormattedActiveAlerts,
        categoryWarning,
        showRisks:
          currentOffenderActiveAlerts.length > 0 ||
          currentOccupantsWithFormattedActiveAlerts.length > 0 ||
          categoryWarning,
        errors,
        backUrl: `/prisoner/${offenderNo}/cell-move/select-cell`,
      })
    } catch (error) {
      res.locals.redirectUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}/location-details`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }

  // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
  const index = async (req, res) => renderTemplate(req, res)

  const post = async (req, res) => {
    const { offenderNo } = req.params
    const { cellId } = req.query
    const redirectUrl = `/prisoner/${offenderNo}/cell-move/select-cell`
    const { systemClientToken } = res.locals

    try {
      const { confirmation } = req.body

      if (!confirmation)
        return renderTemplate(req, res, {
          errors: [{ text: 'Select yes if you are sure you want to select the cell', href: '#confirmation' }],
        })

      if (confirmation === 'yes')
        return res.redirect(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=${cellId}`)

      const [currentOffenderDetails, occupants] = await Promise.all([
        prisonerDetailsService.getDetails(systemClientToken, offenderNo, true),
        prisonerCellAllocationService.getInmatesAtLocation(systemClientToken, cellId),
      ])

      const currentOccupants = occupants.flatMap(occupant => occupant.prisoners)
      const currentOccupantsOffenderNos = currentOccupants.map(occupant => occupant.prisonerNumber)
      const currentOccupantsDetails =
        occupants && (await getOccupantsDetails(systemClientToken, currentOccupantsOffenderNos))

      const offenderAlertCodes = currentOffenderDetails.alerts
        .map(alert => alert)
        .filter(activeCellMoveAlertsExcludingDisabled)
        .map(alert => alert.alertCode)
        .join(',')

      const alertCodesAssociatedWithOccupants = Array.from(
        new Set(
          currentOccupantsDetails
            .flatMap(occupant => occupant)
            .flatMap(occupant => occupant.alerts)
            .filter(activeCellMoveAlertsExcludingDisabled)
            .map(alert => alert.alertCode),
        ),
      ).join(',')

      // eslint-disable-next-line no-underscore-dangle
      const gaClientId = req.cookies?._ga?.match(/.*\.(\d+\.\d+)$/)[1]

      analyticsService
        .sendEvents(gaClientId, [
          {
            name: 'cancelled_on_consider_risks_page',
            params: {
              offender_alert_codes: offenderAlertCodes,
              cell_occupants_alert_codes: alertCodesAssociatedWithOccupants,
            },
          },
        ])
        .catch(_reason => {
          logger.warn('Failed to send Google Analytics event')
        })

      return res.redirect(redirectUrl)
    } catch (error) {
      res.locals.redirectUrl = redirectUrl
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }
  return { index, post }
}
