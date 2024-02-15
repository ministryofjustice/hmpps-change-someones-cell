import { stubFor, verifyPut } from './wiremock'

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

export const stubBookingDetails = details =>
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

export const stubCellMoveTypes = types =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/api/reference-domains/domains/CHG_HOUS_RSN',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: types,
    },
  })

export const stubMoveToCellSwap = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPathPattern: '/api/bookings/[0-9]+?/move-to-cell-swap',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

export const stubAttributesForLocation = locationAttributes =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/api/cell/[0-9]+?/attributes',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: locationAttributes || {},
    },
  })

export const verifyMoveToCellSwap = ({ bookingId }) => verifyPut(`/api/bookings/${bookingId}/move-to-cell-swap`)

export const stubAgencyDetails = (agencyId, details, status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/api/agencies/${agencyId}?activeOnly=false`,
    },
    response: {
      status,
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

export const stubGetPrisoners = body =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/api/prisoners',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: body,
    },
  })

export const stubStaff = (staffId, details) =>
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

export const stubGlobalAlerts = alerts =>
  stubFor({
    request: {
      method: 'POST',
      url: '/api/bookings/offenderNo/alerts',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: alerts || [],
    },
  })

export const stubReceptionWithCapacity = (agencyId, reception) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `/api/agencies/${agencyId}/receptionsWithCapacity`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: reception || {},
    },
  })

export const stubOffendersInReception = (agencyId, inReception) =>
  stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `/api/movements/rollcount/${agencyId}/in-reception`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: inReception || {},
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
  stubBookingDetails,
  stubCellMoveTypes,
  stubMoveToCellSwap,
  stubAttributesForLocation,
  verifyMoveToCellSwap,
  stubAgencyDetails,
  stubCellMoveHistory,
  stubGetPrisoners,
  stubStaff,
  stubGlobalAlerts,
  stubReceptionWithCapacity,
  stubOffendersInReception,
}
