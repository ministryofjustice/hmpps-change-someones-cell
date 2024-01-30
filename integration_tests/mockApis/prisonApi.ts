import { stubFor } from './wiremock'

export const stubUserCaseloads = caseloads =>
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

export const stubInmates = ({ locationId, params, count, data = [] }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `/api/locations/description/${locationId}/inmates`,
      queryParameters: params,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'total-records': `${count}`,
      },
      jsonBody: data,
    },
  })

export const stubOffenderFullDetails = details =>
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

export const stubMainOffence = (offence, status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/bookings/[0-9]+?/mainOffence',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: offence || [],
    },
  })

export const stubOffenderBasicDetails = offender =>
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

export const stubCellAttributes = cellAttributes =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/reference-domains/domains/HOU_UNIT_ATT',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: cellAttributes,
    },
  })

export const stubInmatesAtLocation = inmates =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/api/locations/.+?/inmates',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: inmates || [],
    },
  })

export const stubOffenderCellHistory = history =>
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

export const stubGetAlerts = ({ agencyId, alerts }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPathPattern: `/api/bookings/offenderNo/${agencyId}/alerts`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: alerts || [],
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

export const stubLocation = (locationId, locationData, status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/api/locations/${locationId}`,
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: locationData || {
        locationId,
        locationType: 'WING',
        description: 'HB1',
        agencyId: 'RNI',
        currentOccupancy: 243,
        locationPrefix: 'RNI-HB1',
        internalLocationCode: 'HB1',
      },
    },
  })

export const stubCellsWithCapacity = cells =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/api/agencies/.+?/cellsWithCapacity',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: cells,
    },
  })

export const stubSpecificOffenderFullDetails = details =>
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

export const stubPrisonerFullDetail = (prisonerDetail, offenderNo, fullInfo = true) =>
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

export default {
  stubUserCaseloads,
  stubUpdateCaseload,
  stubStaffRoles,
  stubUserLocations,
  stubHealth,
  stubInmates,
  stubOffenderFullDetails,
  stubMainOffence,
  stubOffenderBasicDetails,
  stubCellAttributes,
  stubInmatesAtLocation,
  stubOffenderCellHistory,
  stubGetAlerts,
  stubCsraAssessments,
  stubLocation,
  stubCellsWithCapacity,
  stubSpecificOffenderFullDetails,
  stubPrisonerFullDetail,
}
