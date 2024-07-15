import { NonAssociationsApiClient } from '../data'
import { PrisonerNonAssociation } from '../data/nonAssociationsApiClient'

export default class NonAssociationsService {
  constructor(private readonly nonAssociationsApiClient: NonAssociationsApiClient) {}

  async getNonAssociations(token: string, offenderNo: string): Promise<PrisonerNonAssociation> {
    return await this.nonAssociationsApiClient.getNonAssociations(token, offenderNo)
  }
}
