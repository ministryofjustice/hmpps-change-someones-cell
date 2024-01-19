import logger from '../../logger'
import config from '../config'
import RestClient from './restClient'

export interface Offender {
  bookingId: number
  bookingNo?: string
  offenderNo: string
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  age: number
  agencyId: string
  assignedLivingUnitId?: number
  assignedLivingUnitDesc?: string
  facialImageId?: number
  assignedOfficerUserId?: string
  aliases?: string[]
  categoryCode?: string
  convictedStatus?: string
  imprisonmentStatus?: string
  alertsCodes: string[]
  alertsDetails: string[]
  legalStatus?: string
}

export interface UserRole {
  roleCode: string
}

export interface CaseLoad extends Record<string, unknown> {
  caseLoadId: string
  description: string
  currentlyActive: boolean
}

export default class PrisonApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Prison Api Client', config.apis.prisonApi, token)
  }

  getInmates(token: string, locationId: string, keywords: string, returnAlerts: boolean = false): Promise<Offender[]> {
    logger.info('Getting inmates: calling Prison Api')
    const returnAlertsString = returnAlerts ? 'true' : 'false'
    const headers = {
      'Page-Limit': '5000',
      'Sort-Fields': 'lastName,firstName',
      'Sort-Order': 'ASC',
    }

    return PrisonApiClient.restClient(token).get<Offender[]>({
      path: `/api/locations/description/${locationId}/inmates`,
      query: { keywords, returnAlerts: returnAlertsString },
      headers,
    })
  }

  getImage(token: string, imageId: string) {
    return PrisonApiClient.restClient(token).stream({ path: `/api/images/${imageId}/data` })
  }

  getPrisonerImage(token: string, offenderNo: string, fullSizeImage = false) {
    return PrisonApiClient.restClient(token).stream({
      path: `/api/bookings/offenderNo/${offenderNo}/image/data?fullSizeImage=${fullSizeImage}`,
    })
  }

  setActiveCaseload(token: string, caseload: CaseLoad) {
    return PrisonApiClient.restClient(token).put({ path: '/api/users/me/activeCaseLoad', data: caseload })
  }

  userCaseLoads(token: string) {
    return PrisonApiClient.restClient(token).get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }
}
