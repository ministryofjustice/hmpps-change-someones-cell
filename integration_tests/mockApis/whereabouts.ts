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

export const stubMoveToCell = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPath: '/whereabouts/cell/make-cell-move',
    },
    response: {
      status: 201,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

export const verifyMoveToCell = body => verifyPosts('/whereabouts/cell/make-cell-move', body)

export default {
  stubHealth,
  stubMoveToCell,
  verifyMoveToCell,
}
