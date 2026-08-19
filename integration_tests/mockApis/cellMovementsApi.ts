import { stubFor, verifyPosts } from './wiremock'

export const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/cell-movements-api/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export const stubMoveToCell = (status = 200) =>
  stubFor({
    request: {
      method: 'POST',
      url: '/cell-movements-api/cell-movements',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

export const verifyMoveToCell = body => verifyPosts('/cell-movements-api/cell-movements', body)

export const stubMoveToCellSwap = (status = 200) =>
  stubFor({
    request: {
      method: 'POST',
      url: '/cell-movements-api/cell-movements/cell-swap',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {},
    },
  })

export const verifyMoveToCellSwap = body => verifyPosts('/cell-movements-api/cell-movements/cell-swap', body)

export default {
  stubHealth,
  stubMoveToCell,
  verifyMoveToCell,
  stubMoveToCellSwap,
  verifyMoveToCellSwap,
}
