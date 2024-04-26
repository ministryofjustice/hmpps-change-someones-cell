import { stubFor } from './wiremock'

export const stubPrisonersAtLocations = prisoners => {
  const pagedResult = {
    totalPages: 1,
    totalElements: 1,
    first: true,
    last: true,
    size: 1,
    content: prisoners,
    number: 1,
    sort: {
      empty: false,
      sorted: true,
      unsorted: false,
    },
    numberOfElements: 1,
    pageable: {
      offset: 0,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      pageSize: 0,
      pageNumber: 0,
      paged: true,
      unpaged: false,
    },
    empty: false,
  }

  return stubFor({
    request: {
      method: 'POST',
      urlPathPattern: '/prisoner-search/attribute-search',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisoners ? pagedResult : [],
    },
  })
}

export default {
  stubPrisonersAtLocations,
}
