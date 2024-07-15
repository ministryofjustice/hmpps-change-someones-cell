import { csraTranslations } from '../../shared/csraHelpers'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'

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
