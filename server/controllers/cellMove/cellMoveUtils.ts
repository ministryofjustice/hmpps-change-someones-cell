import { csraTranslations } from '../../shared/csraHelpers'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'
import { CellMoveReason } from '../../data/cellMovementsApiClient'

export const getNonAssociationsInEstablishment = (nonAssociations: PrisonerNonAssociation) => {
  const validNonAssociations = nonAssociations?.nonAssociations?.filter(
    nonAssociation => nonAssociation.otherPrisonerDetails,
  )
  if (!validNonAssociations) return []
  return validNonAssociations
}

export const getBackLinkData = (referer: string, offenderNo: string) => {
  const backLink = referer || `/prisoner/${offenderNo}/cell-move/search-for-cell`
  let backLinkText = 'Return to select an available cell'

  if (backLink.includes('search-for-cell')) {
    backLinkText = 'Return to search for a cell'
  } else if (backLink.includes('consider-risks-reception')) {
    backLinkText = 'Return to consider risks of reception move'
  }

  return {
    backLink,
    backLinkText,
  }
}

export const getConfirmBackLinkData = (referer, offenderNo) => {
  const backLink = referer || `/prisoner/${offenderNo}/cell-move/search-for-cell`

  return {
    backLink: ['consider-risks', 'select-cell'].some(part => backLink.includes(part))
      ? `/prisoner/${offenderNo}/cell-move/select-cell`
      : backLink,
    backLinkText: ['consider-risks', 'select-cell'].some(part => backLink.includes(part))
      ? 'Select another cell'
      : 'Cancel',
  }
}

export const renderLocationOptions = locations => [
  { text: 'All residential units', value: 'ALL' },
  ...locations.map(location => ({ text: location.name, value: location.key })),
]

/**
 * Cell move reasons as radio items, for the two screens that ask the user to pick one.
 *
 * Retired reasons are dropped. The API serves them so that historic movements can be resolved to a
 * description, but they cannot be chosen for a new move - the API rejects them if posted.
 *
 * Not sorted: the API returns the list in display order and exposes no sequence field, so the order
 * it arrives in is the order to render. The cell move history screen deliberately does not use this
 * helper - it needs every reason, retired ones included, and no `checked`.
 */
export const toReasonRadioItems = (reasons: CellMoveReason[], selectedReason: string) =>
  reasons
    .filter(reason => reason.active)
    .map(reason => ({
      value: reason.code,
      text: reason.description,
      checked: reason.code === selectedReason,
    }))

export const userHasAccess = ({ userRoles, userCaseLoads, offenderCaseload }) => {
  const hasCellMoveRole = userRoles && userRoles.some(role => role === 'ROLE_CELL_MOVE')
  const offenderInCaseload = userCaseLoads && userCaseLoads.some(caseload => caseload.caseLoadId === offenderCaseload)
  return hasCellMoveRole && offenderInCaseload
}

export const cellAttributes = [
  { text: 'Single occupancy', value: 'SO' },
  { text: 'Multiple occupancy', value: 'MO' },
]

export const translateCsra = (csraClassificationCode: string): string => {
  if (!csraClassificationCode) return 'not entered'
  return csraTranslations[csraClassificationCode]
}
