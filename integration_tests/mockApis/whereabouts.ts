import { stubFor, verifyPosts } from './wiremock'

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

export const stubMoveToCell = (status: number) =>
  stubFor({
    request: {
      method: 'POST',
      url: '/whereabouts/cell/make-cell-move?lockTimeout=true',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

export const verifyMoveToCell = body => verifyPosts('/whereabouts/cell/make-cell-move?lockTimeout=true', body)

export default {
  stubHealth,
  stubMoveToCell,
  verifyMoveToCell,
}
