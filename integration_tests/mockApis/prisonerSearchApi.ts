import { stubFor } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/prisoner-search/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export const stubGetPrisoner = prisoner => {
  return stubFor({
    request: {
      method: 'GET',
      urlPathPattern: `/prisoner-search/prisoner/${prisoner.prisonerNumber}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisoner,
    },
  })
}

export const stubGetPrisoners = prisoners => {
  return stubFor({
    request: {
      method: 'POST',
      urlPathPattern: `/prisoner-search/prisoner-search/prisoner-numbers`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisoners,
    },
  })
}

export default {
  stubHealth,
  stubGetPrisoner,
  stubGetPrisoners,
}
