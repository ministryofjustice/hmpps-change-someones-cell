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

/**
 * The reasons a prisoner can be moved between cells. Pass them in the order the API would return
 * them - the UI renders that order rather than sorting - and include retired ones with
 * `active: false` where a spec needs to exercise the history screen.
 */
export const stubCellMoveReasons = reasons =>
  stubFor({
    request: {
      method: 'GET',
      url: '/cell-movements-api/cell-movements/reasons',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: reasons || [],
    },
  })

export default {
  stubHealth,
  stubMoveToCell,
  verifyMoveToCell,
  stubMoveToCellSwap,
  verifyMoveToCellSwap,
  stubCellMoveReasons,
}
