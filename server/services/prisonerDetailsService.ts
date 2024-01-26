import { PrisonApiClient } from '../data'

export default class PrisonerDetailsService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getImage(token: string, imageId: string) {
    return this.prisonApiClient.getImage(token, imageId)
  }

  async getPrisonerImage(token: string, offenderNo: string, fullSizeImage = false) {
    return this.prisonApiClient.getPrisonerImage(token, offenderNo, fullSizeImage)
  }

  async getDetails(token: string, offenderNo: string, fullInfo: boolean) {
    return this.prisonApiClient.getDetails(token, offenderNo, fullInfo)
  }

  async getAlerts(token: string, agencyId: string, offenderNumbers: string[]) {
    return this.prisonApiClient.getAlerts(token, agencyId, offenderNumbers)
  }

  async getCsraAssessments(token: string, offenderNumbers: string[]) {
    return this.prisonApiClient.getCsraAssessments(token, offenderNumbers)
  }
}
