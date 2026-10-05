import config from '../config'
import RestClient from './restClient'

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
  mainOffence?: MainOffence
  alerts: Alert[]
}

/**
 * The most serious active charge, whether or not it resulted in a conviction.
 *
 * Not the same fact as `mostSeriousOffence`, which prisoner-search derives from the sentence and so
 * cannot supply for anyone unsentenced - it was empty for every remand prisoner and every
 * immigration detainee in a 160-prisoner production sample. This one comes from the booking's
 * charges, so it is populated for them too.
 */
export interface MainOffence {
  offenceCode: string
  offenceDescription: string
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

// A whole-prison search runs to thousands, so it pages rather than truncating.
const PRISON_SEARCH_PAGE_SIZE = 500

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
   * Prisoners inside one prison, optionally narrowed by a search term or a cell location prefix.
   *
   * Replaces prison-api's `getInmates`. `term` matches against name or prisoner number;
   * `cellLocationPrefix` takes a residential location such as `MDI-1` and covers every cell beneath
   * it.
   *
   * This endpoint is paged and defaults to ten per page, so it pages to the end. Truncating here
   * would silently drop people from a roll list.
   */
  async findPrisonersInPrison(
    token: string,
    prisonId: string,
    { term, cellLocationPrefix }: { term?: string; cellLocationPrefix?: string },
  ): Promise<Prisoner[]> {
    const query: Record<string, string | number> = { size: PRISON_SEARCH_PAGE_SIZE }
    if (term) query.term = term
    if (cellLocationPrefix) query.cellLocationPrefix = cellLocationPrefix

    const fetchPage = (page: number) =>
      PrisonerSearchApiClient.restClient(token).get<AttributeSearchPage<Prisoner>>({
        path: `/prison/${prisonId}/prisoners`,
        query: { ...query, page },
      })

    const firstPage = await fetchPage(0)
    const prisoners = [...(firstPage?.content || [])]

    for (let page = 1; page < (firstPage?.totalPages || 0); page += 1) {
      // eslint-disable-next-line no-await-in-loop -- pages must be requested in order
      const nextPage = await fetchPage(page)
      prisoners.push(...(nextPage?.content || []))
    }

    return prisoners
  }
}
