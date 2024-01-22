import { stubFor } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/non-associations/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 5000 : '',
    },
  })

export const stubOffenderNonAssociationsLegacy = response =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/non-associations/legacy/api/offenders/[0-9A-Z].+?/non-association-details',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: response,
    },
  })

export const stubGetPrisonerNonAssociations = response =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/non-associations/prisoner/[0-9A-Z].+?/non-associations.*',
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
  stubOffenderNonAssociationsLegacy,
  stubGetPrisonerNonAssociations,
}
