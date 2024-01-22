import { NonAssociationsApiClient } from '../data'
import { OffenderNonAssociationLegacy } from '../data/nonAssociationsApiClient'

export default class NonAssociationsService {
  constructor(private readonly nonAssociationsApiClient: NonAssociationsApiClient) {}

  async getNonAssociations(token: string, offenderNo: string): Promise<OffenderNonAssociationLegacy> {
    return await this.nonAssociationsApiClient.getNonAssociationsLegacy(token, offenderNo)
  }
}
