import { stubFor } from './wiremock'

export const stubHealth = (status = 200) => {
  return stubFor({
    request: {
      method: 'GET',
      urlPath: '/tokenverification/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })
}

export const stubVerifyToken = (active: boolean) => {
  return stubFor({
    request: {
      method: 'POST',
      urlPattern: '/tokenverification/token/verify',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        active,
      },
    },
  })
}

export default {
  stubHealth,
  stubVerifyToken,
}
