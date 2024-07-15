import config from '../config'
import RestClient from './restClient'

export interface PrisonerNonAssociation {
  prisonerNumber: string
  firstName: string
  lastName: string
  prisonId: string
  prisonName: string
  cellLocation?: string
  openCount: number
  closedCount: number
  nonAssociations: NonAssociation[]
}

export interface NonAssociation {
  id: number
  role: string
  roleDescription: string
  reason: string
  reasonDescription: string
  restrictionType: string
  restrictionTypeDescription: string
  comment?: string
  isOpen: boolean
  whenCreated: string
  whenUpdated: string
  updatedBy: string
  otherPrisonerDetails: {
    prisonerNumber: string
    role: string
    roleDescription: string
    firstName: string
    lastName: string
    prisonId: string
    prisonName: string
    cellLocation?: string
  }
}

export default class NonAssociationsApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Non-associations Api Client', config.apis.nonAssociationsApi, token)
  }

  getNonAssociations(token: string, prisonerNumber: string): Promise<PrisonerNonAssociation> {
    return NonAssociationsApiClient.restClient(token).get<PrisonerNonAssociation>({
      path: `/prisoner/${prisonerNumber}/non-associations?includeOpen=true&includeClosed=false&includeOtherPrisons=false&sortBy=WHEN_UPDATED&sortDirection=DESC`,
    })
  }
}
