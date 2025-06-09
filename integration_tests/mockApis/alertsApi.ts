import { stubFor } from './wiremock'

export const stubGlobalAlerts = alerts =>
  stubFor({
    request: {
      method: 'POST',
      url: '/search/alerts/prison-numbers',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: alerts || [],
    },
  })

export default {
  stubGlobalAlerts,
}
