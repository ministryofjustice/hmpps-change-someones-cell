import { PrisonApiClient } from '../data'

export default class PrisonerDetailsService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getImage(token: string, imageId: string) {
    return this.prisonApiClient.getImage(token, imageId)
  }

  async getPrisonerImage(token: string, offenderNo: string, fullSizeImage = false) {
    return this.prisonApiClient.getPrisonerImage(token, offenderNo, fullSizeImage)
  }
}
