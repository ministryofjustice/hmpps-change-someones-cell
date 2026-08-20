import config from '../config'
import RestClient from './restClient'
import logger from '../../logger'

export interface Prisoner {
  prisonerNumber: string
  bookingId?: number
  firstName: string
  middleName?: string
  lastName: string
  gender: string
  prisonId: string
  prisonName: string
  cellLocation?: string
  csra?: string
  category?: string
  mostSeriousOffence?: string
  alerts: Alert[]
}

export interface Alert {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}

export interface AttributeSearchPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

// Reception holds tens of people, not thousands; the size only exists so a single page is certain.
const ATTRIBUTE_SEARCH_PAGE_SIZE = 2000

export default class PrisonerSearchApiClient {
  constructor() {}

  private static restClient(token: string, extraConfig: object = {}): RestClient {
    return new RestClient('Prisoner Search Api Client', { ...config.apis.prisonerSearchApi, ...extraConfig }, token)
  }

  getPrisoner(token: string, prisonerNumber: string): Promise<Prisoner> {
    return PrisonerSearchApiClient.restClient(token).get<Prisoner>({
      path: `/prisoner/${prisonerNumber}`,
    })
  }

  getPrisoners(token: string, prisonerNumbers: string[]): Promise<Prisoner[]> {
    return PrisonerSearchApiClient.restClient(token).post<Prisoner[]>({
      path: `/prisoner-search/prisoner-numbers`,
      data: { prisonerNumbers },
    })
  }

  /**
   * Prisoners currently inside one of the given cell locations at a prison.
   *
   * `cellLocation` on the prisoner record is the path hierarchy without the prison prefix, so
   * virtual locations are matched by their bare code - 'RECP', 'COURT', 'TAP'.
   *
   * Two details of the `IN` condition are load-bearing (prisoner-search's `StringMatcher.kt`):
   * it splits `searchTerm` on commas to build the list, and unlike `IS` it compiles to a
   * `termsQuery` with no `caseInsensitive(true)` - so the codes must match the indexed case.
   */
  async findPrisonersInCellLocations(token: string, prisonId: string, cellLocations: string[]): Promise<Prisoner[]> {
    const page = await PrisonerSearchApiClient.restClient(token).post<AttributeSearchPage<Prisoner>>({
      path: `/attribute-search`,
      query: { size: ATTRIBUTE_SEARCH_PAGE_SIZE },
      data: {
        joinType: 'AND',
        queries: [
          {
            joinType: 'AND',
            matchers: [
              { type: 'String', attribute: 'prisonId', condition: 'IS', searchTerm: prisonId },
              { type: 'String', attribute: 'cellLocation', condition: 'IN', searchTerm: cellLocations.join(',') },
              { type: 'String', attribute: 'inOutStatus', condition: 'IS', searchTerm: 'IN' },
            ],
          },
        ],
      },
    })

    // Truncation would silently under-report occupancy, so say so rather than hide it.
    if (page?.totalPages > 1) {
      logger.warn(
        `Attribute search for ${cellLocations} at ${prisonId} matched ${page.totalElements} prisoners, using the first ${ATTRIBUTE_SEARCH_PAGE_SIZE}`,
      )
    }

    return page?.content || []
  }
}
