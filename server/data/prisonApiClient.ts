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
  modifiedDateTime?: string
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

export interface ProfileInformation {
  type?: string
  question?: string
  resultValue?: string
}

export interface OffenderDetails extends Offender {
  alerts: Alert[]
  assignedLivingUnit: AssignedLivingUnit
  csraClassificationCode: string
  profileInformation?: ProfileInformation[]
  csra?: string
  assessments: Assessment[]
  religion?: string
  physicalAttributes?: {
    sexCode?: string
    gender?: string
    raceCode?: string
    ethnicity?: string
    heightFeet?: number
    heightInches?: number
    heightMetres?: number
    heightCentimetres?: number
    weightPounds?: number
    weightKilograms?: number
  }
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

export interface ReferenceCode {
  domain: string
  code: string
  description: string
  parentDomain?: string
  parentCode?: string
  activeFlag: 'Y' | 'N'
  listSeq?: number
  systemDataFlag?: 'Y' | 'N'
  expiredDate?: string
  subCodes?: ReferenceCode[]
}

export interface OffenceDetail {
  bookingId: number
  offenceDescription: string
  offenceCode: string
  statuteCode: string
}

export interface Telephone {
  phoneId?: number
  number: string
  type: string
  ext?: string
}

export interface Address {
  addressId?: number
  addressType?: string
  flat?: string
  premise?: string
  street?: string
  locality?: string
  town?: string
  postalCode?: string
  county?: string
  country?: string
  comment?: string
  primary: boolean
  noFixedAddress: boolean
  startDate?: string
  endDate?: string
  phones?: Telephone[]
  addressUsages?: {
    addressId?: number
    addressUsage?: string
    addressUsageDescription?: string
    activeFlag?: boolean
  }[]
}

export interface Agency {
  agencyId: string
  description: string
  longDescription?: string
  agencyType: string
  active: boolean
  courtType?: string
  deactivationDate?: string
  addresses?: Address[]
  phones?: Telephone[]
  emails?: {
    email: string
  }[]
}

export interface BedAssignment {
  bookingId: number
  livingUnitId: number
  assignmentDate: string
  assignmentDateTime: string
  assignmentReason: string
  assignmentEndDate: string
  assignmentEndDateTime: string
  agencyId: string
  description: string
  bedAssignmentHistorySequence: number
  movementMadeBy: string
  offenderNo: string
}

export interface UserDetail {
  staffId: number
  username: string
  firstName: string
  lastName: string
  thumbnailId: number
  activeCaseLoadId: string
  accountStatus: string
  lockDate: string
  expiryDate: string
  lockedFlag: boolean
  expiredFlag: boolean
  active: boolean
}

export interface PrisonerDetailSearchCriteria {
  offenderNos?: string[]
  firstName?: string
  gender?: string
  middleNames?: string
  lastName?: string
  location?: string
  pncNumber?: string
  croNumber?: string
  dob?: string
  dobFrom?: string
  dobTo?: string
  maxYearsRange?: number
  includeAliases?: boolean
  partialNameMatch?: boolean
  anyMatch?: boolean
  prioritisedMatch?: boolean
}

export interface PrisonerDetail {
  offenderNo: string
  title?: string
  suffix?: string
  firstName: string
  middleNames?: string
  lastName: string
  dateOfBirth: string
  gender: string
  sexCode: string
  nationalities?: string
  currentlyInPrison: string
  latestBookingId?: number
  latestLocationId?: string
  latestLocation?: string
  internalLocation?: string
  pncNumber?: string
  croNumber?: string
  ethnicity?: string
  ethnicityCode?: string
  birthCountry?: string
  religion?: string
  religionCode?: string
  convictedStatus?: string
  legalStatus?: string
  imprisonmentStatus?: string
  imprisonmentStatusDesc?: string
  receptionDate?: string
  maritalStatus?: string
  currentWorkingFirstName: string
  currentWorkingLastName: string
  currentWorkingBirthDate: string
}

export interface Page<T> {
  totalPages: number
  totalElements: number
  first: boolean
  last: boolean
  size: number
  content: T[]
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  pageable: {
    offset: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    pageSize: number
    pageNumber: number
    paged: boolean
    unpaged: boolean
  }
  empty: boolean
}

export interface OffenderInReception {
  offenderNo: string
  bookingId: number
  dateOfBirth: string
  firstName: string
  lastName: string
}

export default class PrisonApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Prison Api Client', { ...config.apis.prisonApi, ...extraConfig }, token)
  }

  /**
   * @deprecated Use prisoner search to find prisoners
   */
  getInmates(token: string, locationId: string, keywords?: string, returnAlerts: boolean = false): Promise<Offender[]> {
    const query: Record<string, string> = { returnAlerts: returnAlerts ? 'true' : 'false' }
    if (keywords) {
      query.keywords = keywords
    }
    const headers = {
      'Page-Limit': '5000',
      'Sort-Fields': 'lastName,firstName',
      'Sort-Order': 'ASC',
    }

    return PrisonApiClient.restClient(token).get<Offender[]>({
      path: `/api/locations/description/${locationId}/inmates`,
      query,
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
    return PrisonApiClient.restClient(token).put<CaseLoad>({ path: '/api/users/me/activeCaseLoad', data: caseload })
  }

  userCaseLoads(token: string) {
    return PrisonApiClient.restClient(token).get<CaseLoad[]>({ path: '/api/users/me/caseLoads' })
  }

  /**
   * @deprecated Use prisoner search to get prisoners
   */
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

  getCellMoveReasonTypes(token: string) {
    const headers = { 'Page-Limit': '1000' }

    return PrisonApiClient.restClient(token).get<ReferenceCode[]>({
      path: '/api/reference-domains/domains/CHG_HOUS_RSN',
      headers,
    })
  }

  /**
   * @deprecated NOT USED REMOVE
   */
  moveToCellSwap(token: string, bookingId: number) {
    return PrisonApiClient.restClient(token).put<OffenderDetails>({
      path: `/api/bookings/${bookingId}/move-to-cell-swap`,
    })
  }

  /**
   * @deprecated Main offence can be obtained from prisoner search
   */
  getMainOffence(token: string, bookingId: number) {
    return PrisonApiClient.restClient(token).get<OffenceDetail[]>({
      path: `/api/bookings/${bookingId}/mainOffence`,
    })
  }

  getAgencyDetails(token: string, agencyId: string) {
    return PrisonApiClient.restClient(token).get<Agency>({
      path: `/api/agencies/${agencyId}?activeOnly=false`,
    })
  }

  getHistoryByDate(token: string, agencyId: string, assignmentDate: string) {
    return PrisonApiClient.restClient(token).get<BedAssignment[]>({
      path: `/api/cell/${agencyId}/history/${assignmentDate}`,
    })
  }

  getStaffDetails(token: string, username: string) {
    return PrisonApiClient.restClient(token).get<UserDetail>({
      path: `/api/users/${username}`,
    })
  }

  getOffenderCellHistory(token: string, bookingId: number) {
    return PrisonApiClient.restClient(token).get<Page<BedAssignment>>({
      path: `/api/bookings/${bookingId}/cell-history`,
      query: { page: 0, size: 20 },
    })
  }

  /**
   * @todo Move functionality to location API
   */
  getReceptionsWithCapacity(token: string, agencyId: string) {
    return PrisonApiClient.restClient(token, { timeout: { deadline: 30000 } }).get<OffenderCell[]>({
      path: `/api/agencies/${agencyId}/receptionsWithCapacity`,
    })
  }

  /**
   * @todo Reception roll count should be obtainable from prisoner search
   */
  getOffendersInReception(token: string, agencyId: string) {
    return PrisonApiClient.restClient(token).get<OffenderInReception[]>({
      path: `/api/movements/rollcount/${agencyId}/in-reception`,
    })
  }
}
