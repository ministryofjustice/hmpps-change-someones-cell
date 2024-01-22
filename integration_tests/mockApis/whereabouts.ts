import { stubFor } from './wiremock'

export const stubLocationConfig = ({ agencyId, response }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/whereabouts/agencies/${agencyId}/locations/whereabouts`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: response,
    },
  })

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/whereabouts/health/ping',
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
      url: `/whereabouts/agencies/${caseload.id}/locations/groups`,
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

export const stubCellsWithCapacityByGroupName = ({ agencyId, groupName, response }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/whereabouts/locations/cellsWithCapacity/${agencyId}/${groupName}`,
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
  stubLocationConfig,
  stubHealth,
  stubGroups,
  stubCellsWithCapacityByGroupName,
}
