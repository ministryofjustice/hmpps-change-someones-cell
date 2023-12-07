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

export default {
  stubLocationConfig,
  stubHealth,
}
