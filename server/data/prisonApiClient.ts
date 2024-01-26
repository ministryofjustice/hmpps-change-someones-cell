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

export interface Alert {
  alertId: number
  bookingId: number
  offenderNo: string
  alertType: string
  alertTypeDescription: string
  alertCode: string
  alertCodeDescription: string
  comment: string
  dateCreated: string
  dateExpires: string
  modifiedDateTime: string
  expired: boolean
  active: boolean
  addedByFirstName: string
  addedByLastName: string
  expiredByFirstName: string
  expiredByLastName: string
}

export interface AssignedLivingUnit {
  agencyId: string
  locationId: number
  description: string
  agencyName: string
}

export interface OffenderDetails extends Offender {
  alerts: Alert[]
  assignedLivingUnit: AssignedLivingUnit
  csraClassificationCode: string
}

export interface UserRole {
  roleCode: string
}

export interface CaseLoad extends Record<string, unknown> {
  caseLoadId: string
  description: string
  currentlyActive: boolean
}

export interface Assessment {
  bookingId: number
  offenderNo: string
  classificationCode: string
  classification: string
  assessmentCode: string
  assessmentDescription: string
  cellSharingAlertFlag: boolean
  assessmentDate: string
  nextReviewDate: string
  approvalDate: string
  assessmentAgencyId: string
  assessmentStatus: string
  assessmentSeq: number
  assessmentComment: string
  assessorId: number
  assessorUser: string
}

export interface Location {
  locationId: number
  locationType: string
  description: string
  locationUsage: string
  agencyId: string
  parentLocationId: number
  currentOccupancy: number
  locationPrefix: string
  operationalCapacity: number
  userDescription: string
  internalLocationCode: string
  subLocations: boolean
}

export interface OffenderCell {
  id: number
  description: string
  userDescription?: string
  capacity: number
  noOfOccupants: number
  attributes: {
    code: string
    description: string
  }[]
}

export default class PrisonApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Prison Api Client', { ...config.apis.prisonApi, ...extraConfig }, token)
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

  getInmatesAtLocation(token: string, locationId: number): Promise<Offender[]> {
    return PrisonApiClient.restClient(token).get<Offender[]>({
      path: `/api/locations/${locationId}/inmates`,
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
    return PrisonApiClient.restClient(token).put<CaseLoad>({ path: '/api/users/me/activeCaseLoad', data: caseload })
  }

  userCaseLoads(token: string) {
    return PrisonApiClient.restClient(token).get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }

  getDetails(token: string, offenderNo: string, fullInfo = false) {
    const fullInfoString = fullInfo ? 'true' : 'false'
    return PrisonApiClient.restClient(token).get<OffenderDetails>({
      path: `/api/bookings/offenderNo/${offenderNo}?fullInfo=${fullInfoString}&csraSummary=${fullInfoString}`,
    })
  }

  getAlerts(token: string, agencyId: string, offenderNumbers: string[]) {
    return PrisonApiClient.restClient(token).post<Alert[]>({
      path: `/api/bookings/offenderNo/${agencyId}/alerts`,
      data: offenderNumbers,
    })
  }

  getCsraAssessments(token: string, offenderNumbers: string[]) {
    return PrisonApiClient.restClient(token).post<Assessment[]>({
      path: '/api/offender-assessments/csra/list',
      data: offenderNumbers,
    })
  }

  getLocation(token: string, livingUnitId: number) {
    return PrisonApiClient.restClient(token).get<Location>({ path: `/api/locations/${livingUnitId}` })
  }

  getCellsWithCapacity(token: string, agencyId: string) {
    return PrisonApiClient.restClient(token, { timeout: { deadline: 30000 } }).get<OffenderCell[]>({
      path: `/api/agencies/${agencyId}/cellsWithCapacity`,
    })
  }
}
