import config from '../config'
import RestClient from './restClient'

export interface CellMovement {
  id: string
  movementType: 'CELL_MOVE' | 'CELL_SWAP'
  prisonerNumber: string
  fromLocationKey?: string
  fromLocationId?: string
  toLocationKey: string
  toLocationId?: string
  reasonCode: string
  occurredAt: string
  recordedBy: string
  caseNoteUuid?: string
  status: 'PENDING' | 'COMPLETED' | 'CASE_NOTE_FAILED'
}

export interface CellMoveReason {
  code: string
  description: string
  /** False for a retired reason: still returned so historic movements resolve, but not selectable. */
  active: boolean
}

/**
 * Client for hmpps-change-someones-cell-api, which performs the NOMIS move, records the
 * MOVED_CELL case note and keeps its own record of every movement.
 *
 * Both calls take a prisoner number, not a booking id - the API resolves the current booking
 * itself, and bookingId is a NOMIS-only concept being retired from new services.
 *
 * Call with res.locals.systemClientToken: that token is minted with the signed-in user's
 * username, which is how the NOMIS audit columns and the case note end up attributed to the
 * real user rather than a system client.
 */
export default class CellMovementsApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Cell Movements Api Client', config.apis.cellMovementsApi, token)
  }

  /**
   * Errors worth knowing about: 400 means the cell cannot be used (full, inactive, wrong prison -
   * the cell-not-available page), 423 means the prisoner's record is open in P-NOMIS, 409 means
   * this exact move was submitted moments ago.
   */
  moveToCell(token: string, prisonerNumber: string, toLocationKey: string, reasonCode: string, commentText: string) {
    return CellMovementsApiClient.restClient(token).post<CellMovement>({
      path: '/cell-movements',
      data: {
        prisonerNumber,
        toLocationKey,
        reasonCode,
        commentText,
      },
    })
  }

  /**
   * Moves the prisoner out to the prison's cell swap location, freeing their cell. The API
   * derives the destination and records no case note - the journey never asks the user why.
   */
  moveToCellSwap(token: string, prisonerNumber: string) {
    return CellMovementsApiClient.restClient(token).post<CellMovement>({
      path: '/cell-movements/cell-swap',
      data: { prisonerNumber },
    })
  }

  /**
   * The reasons a prisoner can be moved between cells - reference data this API owns, having taken
   * it over from prison-api's CHG_HOUS_RSN domain.
   *
   * Two things about the response are contracts, not incidental:
   *
   * - **It is already in display order.** Do not sort it. There is no sequence field to sort on,
   *   deliberately, so that a second consumer cannot invent a second ordering.
   * - **It includes retired reasons**, marked `active: false`. They cannot be chosen for a new
   *   move, but historic movements carry them, so a screen resolving a code to a description needs
   *   them. Filter on `active` when offering a choice; do not filter when looking a code up.
   */
  getCellMoveReasons(token: string) {
    return CellMovementsApiClient.restClient(token).get<CellMoveReason[]>({
      path: '/cell-movements/reasons',
    })
  }
}
