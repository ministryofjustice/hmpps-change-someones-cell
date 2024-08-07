import jwt from 'jsonwebtoken'
import { stubUser, stubUserMe } from './users'
import { getMatchingRequests, stubFor } from './wiremock'
import { stubStaffRoles, stubUserLocations } from './prisonApi'

const createToken = roles => {
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities: ['ROLE_GLOBAL_SEARCH', ...roles],
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'dev',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const getSignInUrl = () =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then(data => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/sign-in/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=.+?',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3008/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/auth/sign-out',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const token = roles =>
  stubFor({
    request: {
      method: 'POST',
      url: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3008/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(roles),
        token_type: 'bearer',
        refresh_token: 'refresh',
        user_name: 'TEST_USER',
        expires_in: 600,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/auth/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 3000 : '',
    },
  })

const stubClientCredentialsRequest = () =>
  stubFor({
    request: {
      method: 'POST',
      url: '/auth/oauth/token',
    },
    response: {
      status: 200,
      jsonBody: {
        access_token: 'EXAMPLE_ACCESS_TOKEN',
        refresh_token: 'EXAMPLE_REFRESH_TOKEN',
        expires_in: 43200,
      },
    },
  })

export default {
  stubHealth,
  getSignInUrl,
  stubSignIn: (username, caseloadId, roles = []) =>
    Promise.all([
      favicon(),
      redirect(),
      signOut(),
      token(roles),
      stubUserMe(username, 12345, 'James Stuart', caseloadId),
      stubUser(username, caseloadId),
      stubUserLocations(),
      stubStaffRoles(),
    ]),
  stubSignInCourt: () =>
    Promise.all([
      favicon(),
      redirect(),
      signOut(),
      token(['ROLE_GLOBAL_SEARCH', 'ROLE_VIDEO_LINK_COURT_USER']),
      stubUserMe(),
    ]),
  redirect,
  stubClientCredentialsRequest,
}
