/* tslint:disable:noImplicitAny */

import contextProperties from '../contextProperties'
import { mapToQueryString } from '../utils'

export type CaseLoad = {
  caseLoadId: string
  description: string
  currentlyActive: boolean
}

export const prisonApiFactory = client => {
  const processResponse = context => response => {
    contextProperties.setResponsePagination(context, response.headers)
    return response.body
  }

  const get = (context, url, resultsLimit?, retryOverride?) =>
    client.get(context, url, { resultsLimit, retryOverride }).then(processResponse(context))

  const map404ToNull = error => {
    if (!error.response) throw error
    if (!error.response.status) throw error
    if (error.response.status !== 404) throw error
    return null
  }
  const getWithHandle404 = (context, url, resultsLimit?, retryOverride?) =>
    client.get(context, url, { resultsLimit, retryOverride }).then(processResponse(context)).catch(map404ToNull)

  const getWithCustomTimeout = (context, path, overrides) =>
    client.getWithCustomTimeout(context, path, overrides).then(processResponse(context))

  const post = (context, url, data) => client.post(context, url, data).then(processResponse(context))

  const put = (context, url, data) => client.put(context, url, data).then(processResponse(context))

  const userCaseLoads = (context): [CaseLoad] =>
    context.authSource !== 'auth' ? get(context, '/api/users/me/caseLoads') : []

  // NB. This function expects a caseload object.
  // The object *must* have non-blank caseLoadId,  description and type properties.
  // However, only 'caseLoadId' has meaning.  The other two properties can take *any* non-blank value and these will be ignored.
  const setActiveCaseload = (context, caseload) => put(context, '/api/users/me/activeCaseLoad', caseload)

  const getAgencyDetails = (context, agencyId) => get(context, `/api/agencies/${agencyId}?activeOnly=false`)

  const getAlerts = (context, { agencyId, offenderNumbers }) =>
    post(context, `/api/bookings/offenderNo/${agencyId}/alerts`, offenderNumbers)

  const getCsraAssessments = (context, offenderNumbers) =>
    post(context, `/api/offender-assessments/csra/list`, offenderNumbers)

  const getStaffDetails = (context, staffId) => getWithHandle404(context, `/api/users/${staffId}`)

  const getDetails = (context, offenderNo, fullInfo = false) =>
    get(context, `/api/bookings/offenderNo/${offenderNo}?fullInfo=${fullInfo}&csraSummary=${fullInfo}`)

  const getLocation = (context, livingUnitId) => get(context, `/api/locations/${livingUnitId}`)

  const getMainOffence = (context, bookingId) => get(context, `/api/bookings/${bookingId}/mainOffence`)

  const getInmates = (context, locationId, params) =>
    get(context, `/api/locations/description/${locationId}/inmates?${mapToQueryString(params)}`)

  const getInmatesAtLocation = (context, locationId, params) =>
    get(context, `/api/locations/${locationId}/inmates?${mapToQueryString(params)}`)

  const getCellMoveReasonTypes = context => get(context, '/api/reference-domains/domains/CHG_HOUS_RSN', 1000)

  const getCellsWithCapacity = (context, agencyId, attribute) =>
    getWithCustomTimeout(
      context,
      attribute
        ? `/api/agencies/${agencyId}/cellsWithCapacity?attribute=${attribute}`
        : `/api/agencies/${agencyId}/cellsWithCapacity`,
      {
        customTimeout: 30000,
      },
    )
  const getReceptionsWithCapacity = (context, agencyId, attribute) =>
    getWithCustomTimeout(
      context,
      attribute
        ? `/api/agencies/${agencyId}/receptionsWithCapacity?attribute=${attribute}`
        : `/api/agencies/${agencyId}/receptionsWithCapacity`,
      {
        customTimeout: 30000,
      },
    )

  const getAttributesForLocation = (context, locationId) => get(context, `/api/cell/${locationId}/attributes`)

  const getHistoryByDate = (context, { assignmentDate, agencyId }) =>
    get(context, `/api/cell/${agencyId}/history/${assignmentDate}`)

  const moveToCellSwap = (context, { bookingId }) => put(context, `/api/bookings/${bookingId}/move-to-cell-swap`, {})

  const getPrisoners = (context, searchCriteria) => post(context, `/api/prisoners`, searchCriteria)

  return {
    getAgencyDetails,
    getAlerts,
    getAttributesForLocation,
    setActiveCaseload,
    getCellMoveReasonTypes,
    getCellsWithCapacity,
    getCsraAssessments,
    getDetails,
    getHistoryByDate,
    getInmates,
    getInmatesAtLocation,
    getLocation,
    getMainOffence,
    getPrisoners,
    getReceptionsWithCapacity,
    getStaffDetails,
    moveToCellSwap,
    userCaseLoads,
  }
}

export default { prisonApiFactory }
