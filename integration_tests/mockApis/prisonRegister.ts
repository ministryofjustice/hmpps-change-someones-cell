import { stubFor } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/prisonRegister/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export const stubPrisonById = ({ prisonId, prisonName }: { prisonId: string; prisonName: string }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prisonRegister/prisons/id/${prisonId}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: { prisonId, prisonName, active: true },
    },
  })

export default {
  stubHealth,
  stubPrisonById,
}
