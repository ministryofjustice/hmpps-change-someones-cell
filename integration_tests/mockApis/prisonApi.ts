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

export default {
  stubUserCaseloads,
  stubUpdateCaseload,
  stubStaffRoles,
  stubUserLocations,
  stubHealth,
}
