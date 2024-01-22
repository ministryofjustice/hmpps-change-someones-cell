import config from '../config'
import RestClient from './restClient'

export interface OffenderNonAssociationLegacy {
  offenderNo: string
  firstName: string
  lastName: string
  agencyDescription: string
  assignedLivingUnitDescription: string
  assignedLivingUnitId: number
  nonAssociations: {
    reasonCode: string
    reasonDescription: string
    typeCode: string
    typeDescription: string
    effectiveDate: string
    expiryDate: string | null
    authorisedBy: string
    comments: string
    offenderNonAssociation: {
      offenderNo: string
      firstName: string
      lastName: string
      reasonCode: string
      reasonDescription: string
      agencyDescription: string
      assignedLivingUnitDescription: string
      assignedLivingUnitId: number
    }
  }[]
}

export default class NonAssociationsApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Non-associations Api Client', config.apis.nonAssociationsApi, token)
  }

  getNonAssociationsLegacy(token: string, offenderNo: string): Promise<OffenderNonAssociationLegacy> {
    return NonAssociationsApiClient.restClient(token).get<OffenderNonAssociationLegacy>({
      path: `/legacy/api/offenders/${offenderNo}/non-association-details`,
    })
  }
}
