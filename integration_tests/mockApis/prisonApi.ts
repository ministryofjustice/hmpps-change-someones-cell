import { stubFor } from './wiremock'

export const stubUserCaseloads = (caseloads?: object[]) =>
  stubFor({
    request: {
      method: 'GET',
      url: '/api/users/me/caseLoads',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: caseloads || [
        {
          caseLoadId: 'MDI',
          description: 'Moorland',
          currentlyActive: true,
        },
      ],
    },
  })

export const stubUpdateCaseload = () =>
  stubFor({
    request: {
      method: 'PUT',
      url: '/api/users/me/activeCaseLoad',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export const stubStaffRoles = (roles = null) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/api/staff/.+?/.+?/roles`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: roles || [{ role: 'KW' }, { role: 'WORK_READINESS_VIEW' }],
    },
  })

export const stubUserLocations = (locations = null) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/users/me/locations',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: locations || [
        {
          locationId: 1,
          locationType: 'INST',
          description: 'Moorland (HMP & YOI)',
          agencyId: 'MDI',
          locationPrefix: 'MDI',
        },
        {
          locationId: 2,
          locationType: 'WING',
          description: 'Houseblock 1',
          agencyId: 'MDI',
          locationPrefix: 'MDI-1',
          userDescription: 'Houseblock 1',
          subLocations: true,
        },
        {
          locationId: 3,
          locationType: 'WING',
          description: 'Houseblock 2',
          agencyId: 'MDI',
          locationPrefix: 'MDI-2',
          userDescription: 'Houseblock 2',
          subLocations: true,
        },
      ],
    },
  })

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 5000 : '',
    },
  })

export const stubOffenderFullDetails = (details?: object) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/api/bookings/offenderNo/.+?\\?fullInfo=true&csraSummary=true`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: details || {},
    },
  })

export const stubOffenderBasicDetails = (offender?: object) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/api/bookings/offenderNo/.+?\\?fullInfo=false&csraSummary=false`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: offender || {},
    },
  })

export const stubOffenderCellHistory = (history?: object) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/api/bookings/[0-9]+?/cell-history',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: history || { content: [] },
    },
  })

export const stubCsraAssessments = (offenderNumbers, assessments = []) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/api/offender-assessments/csra/list',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: assessments,
    },
  })

export const stubSpecificOffenderFullDetails = (details: { offenderNo: string }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/api/bookings/offenderNo/${details.offenderNo}\\?fullInfo=true&csraSummary=true`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: details || {},
    },
  })

export const stubPrisonerFullDetail = (prisonerDetail: object, offenderNo: string, fullInfo = true) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/api/bookings/offenderNo/${offenderNo}?fullInfo=${fullInfo}&csraSummary=${fullInfo}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisonerDetail || {},
    },
  })

export const stubBookingDetails = (details?: object) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/bookings/offenderNo/.+?',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: details || {},
    },
  })

export const stubCellMoveHistory = ({ assignmentDate, agencyId, cellMoves }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: `/api/cell/${agencyId}/history/${assignmentDate}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: cellMoves,
    },
  })

export const stubStaff = (staffId: string | number, details?: object) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/api/users/${encodeURIComponent(staffId)}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: details || {
        firstName: 'JAMES',
        lastName: 'STUART',
        activeCaseLoadId: 'MDI',
      },
    },
  })

export default {
  stubUserCaseloads,
  stubUpdateCaseload,
  stubStaffRoles,
  stubUserLocations,
  stubHealth,
  stubOffenderFullDetails,
  stubOffenderBasicDetails,
  stubOffenderCellHistory,
  stubCsraAssessments,
  stubSpecificOffenderFullDetails,
  stubPrisonerFullDetail,
  stubBookingDetails,
  stubCellMoveHistory,
  stubStaff,
}
