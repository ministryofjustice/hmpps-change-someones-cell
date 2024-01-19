import { HmppsAuthClient, PrisonApiClient } from '../data'
import { Offender } from '../data/prisonApiClient'

export default class PrisonerCellAllocationService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getInmates(
    username: string,
    locationId: string,
    keywords: string,
    returnAlerts?: boolean,
  ): Promise<Offender[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    return await this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }
}
