import config from '../config'
import RestClient from './restClient'

export interface LocationGroup {
  name: string
  key: string
  children: LocationGroup[]
}

export interface CellMoveResponse {
  cellMoveResult: {
    bookingId: number
    agencyId: string
    assignedLivingUnitId: number
    assignedLivingUnitDesc: string
    bedAssignmentHistorySequence: number
    caseNoteId: number
  }
}

export interface LocationPrefix {
  locationPrefix: string
}

export default class WhereaboutsApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Whereabouts Api Client', config.apis.whereaboutsApi, token)
  }

  moveToCell(
    token: string,
    bookingId: number,
    offenderNo: string,
    internalLocationDescriptionDestination: string,
    cellMoveReasonCode: string,
    commentText: string,
  ) {
    return WhereaboutsApiClient.restClient(token).post<CellMoveResponse>({
      path: '/cell/make-cell-move',
      query: { lockTimeout: 'true' },
      data: {
        bookingId,
        offenderNo,
        internalLocationDescriptionDestination,
        cellMoveReasonCode,
        commentText,
      },
    })
  }
}
