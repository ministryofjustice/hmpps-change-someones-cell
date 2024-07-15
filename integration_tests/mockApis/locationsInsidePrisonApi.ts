import { stubFor } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/locations-inside-prison-api/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export const stubGroups = (caseload, status = 200) => {
  const json = [
    {
      name: '1',
      key: '1',
      children: [
        {
          name: 'A',
          key: 'A',
        },
        {
          name: 'B',
          key: 'B',
        },
        {
          name: 'C',
          key: 'C',
        },
      ],
    },
    {
      name: '2',
      key: '2',
      children: [
        {
          name: 'A',
          key: 'A',
        },
        {
          name: 'B',
          key: 'B',
        },
        {
          name: 'C',
          key: 'C',
        },
      ],
    },
    {
      name: '3',
      key: '3',
      children: [
        {
          name: 'A',
          key: 'A',
        },
        {
          name: 'B',
          key: 'B',
        },
        {
          name: 'C',
          key: 'C',
        },
      ],
    },
  ]

  const jsonSYI = [
    {
      name: 'block1',
      key: 'block1',
      children: [
        {
          name: 'A',
          key: 'A',
        },
        {
          name: 'B',
          key: 'B',
        },
      ],
    },
    {
      name: 'block2',
      key: 'block2',
      children: [
        {
          name: 'A',
          key: 'A',
        },
        {
          name: 'B',
          key: 'B',
        },
        {
          name: 'C',
          key: 'C',
        },
      ],
    },
  ]

  return stubFor({
    request: {
      method: 'GET',
      url: `/locations-inside-prison-api/locations/prison/${caseload.id}/groups`,
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: caseload.id === 'SYI' ? jsonSYI : json,
    },
  })
}

export const stubLocation = location => {
  return stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/locations-inside-prison-api/locations/key/.+',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: location || {},
    },
  })
}

export const stubInmatesAtLocation = inmates => {
  return stubFor({
    request: {
      method: 'GET',
      urlPathPattern: '/locations-inside-prison-api/prisoner-locations/key/.+',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: inmates || [],
    },
  })
}

export const stubCellsWithCapacityByGroupName = ({ prisonId, groupName, response }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/locations-inside-prison-api/location-occupancy/cells-with-capacity/${prisonId}?includePrisonerInformation=true&groupName=${groupName}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: response,
    },
  })

export const stubCellsWithCapacity = ({ prisonId, response }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/locations-inside-prison-api/location-occupancy/cells-with-capacity/${prisonId}?includePrisonerInformation=true`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: response,
    },
  })

export default {
  stubHealth,
  stubGroups,
  stubLocation,
  stubInmatesAtLocation,
  stubCellsWithCapacity,
  stubCellsWithCapacityByGroupName,
}
