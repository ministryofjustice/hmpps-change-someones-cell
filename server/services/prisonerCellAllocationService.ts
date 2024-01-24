import { PrisonApiClient } from '../data'
import { Offender } from '../data/prisonApiClient'

export default class PrisonerCellAllocationService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  async getInmates(token: string, locationId: string, keywords: string, returnAlerts?: boolean): Promise<Offender[]> {
    return await this.prisonApiClient.getInmates(token, locationId, keywords, returnAlerts)
  }
}
