import { stubFor, getFor } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/users/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 5000 : '',
    },
  })

export const stubUser = (username, caseload) => {
  const user = username || 'ITAG_USER'
  const activeCaseLoadId = caseload || 'MDI'
  return stubFor({
    request: {
      method: 'GET',
      url: `/users/users/${encodeURI(user)}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        user_name: user,
        staffId: 231232,
        username: user,
        active: true,
        name: `${user} name`,
        authSource: 'nomis',
        activeCaseLoadId,
      },
    },
  })
}

export const stubUserMe = (username = 'ITAG_USER', staffId = 12345, name = 'James Stuart', caseload = 'MDI') =>
  getFor({
    urlPath: '/users/users/me',
    body: {
      firstName: 'JAMES',
      lastName: 'STUART',
      name,
      username,
      activeCaseLoadId: caseload,
      staffId,
    },
  })

export const stubUserMeRoles = (roles: string[] = []) =>
  getFor({
    urlPath: '/users/users/me/roles',
    body: roles.map(role => ({ roleCode: role })),
  })

export const stubEmail = username =>
  stubFor({
    request: {
      method: 'GET',
      url: `/users/users/${encodeURI(username)}/email`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username,
        email: `${username}@gov.uk`,
      },
    },
  })

export default {
  stubHealth,
  stubUserMe,
  stubUserMeRoles,
  stubUser,
  stubEmail,
}
