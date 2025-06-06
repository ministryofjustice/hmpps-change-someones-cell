import AlertsApiClient from '../data/alertsApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'

export default class PrisonerDetailsService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly alertsApiClient: AlertsApiClient,
    private readonly prisonerSearchApiClient: PrisonerSearchApiClient,
  ) {}

  async getImage(token: string, imageId: string) {
    return this.prisonApiClient.getImage(token, imageId)
  }

  async getPrisonerImage(token: string, offenderNo: string, fullSizeImage = false) {
    return this.prisonApiClient.getPrisonerImage(token, offenderNo, fullSizeImage)
  }

  async getPrisoner(token: string, prisonerNumber: string): Promise<Prisoner> {
    return await this.prisonerSearchApiClient.getPrisoner(token, prisonerNumber)
  }

  async getPrisoners(token: string, prisonerNumbers: string[]): Promise<Prisoner[]> {
    if (prisonerNumbers.length > 0) {
      return await this.prisonerSearchApiClient.getPrisoners(token, prisonerNumbers)
    }
    return []
  }

  /**
   * @deprecated Use prisoner search to get prisoners
   */
  async getDetails(token: string, offenderNo: string, fullInfo: boolean = false) {
    return this.prisonApiClient.getDetails(token, offenderNo, fullInfo)
  }

  async getAlerts(token: string, offenderNumbers: string[]) {
    return this.alertsApiClient.getAlerts(token,offenderNumbers)
  }

  async getCsraAssessments(token: string, offenderNumbers: string[]) {
    return this.prisonApiClient.getCsraAssessments(token, offenderNumbers)
  }

  /**
   * @deprecated Main offence can be obtained from prisoner search
   */
  async getMainOffence(token: string, bookingId: number) {
    return this.prisonApiClient.getMainOffence(token, bookingId)
  }
}
