import superagent from 'superagent'

const url = 'http://localhost:9091/__admin'

const stubFor = (mapping: object) => superagent.post(`${url}/mappings`).send(mapping)

/** Makes stateful stubs */
const stubScenario = ({ scenarioName, mappings }: { scenarioName: string; mappings: Record<string, object> }) => {
  let previousState = 'Started'
  const promises = Object.entries(mappings).map(([state, mapping]) => {
    const promise = superagent.post(`${url}/mappings`).send({
      ...mapping,
      scenarioName,
      requiredScenarioState: previousState,
      newScenarioState: state,
    })
    previousState = state
    return promise
  })
  return Promise.all(promises)
}

const getRequests = () => superagent.get(`${url}/requests`)

const getMatchingRequests = (body: object) => superagent.post(`${url}/requests/find`).send(body)

const resetStubs = () => Promise.all([superagent.delete(`${url}/mappings`), superagent.delete(`${url}/requests`)])

const resetStub = ({ requestUrl, method }: { requestUrl: string; method: string }) => {
  return superagent.post(`${url}/requests/remove`).send({
    method,
    url: requestUrl,
  })
}

const verifyPosts = (requestUrl: string, body?: object) => {
  const bodyPatterns =
    (body && {
      bodyPatterns: [{ equalToJson: JSON.stringify(body) }],
    }) ||
    {}

  return superagent.post(`${url}/requests/count`).send({
    method: 'POST',
    url: requestUrl,
    ...bodyPatterns,
  })
}

const verifyPut = (requestUrl: string) =>
  superagent.post(`${url}/requests/count`).send({
    method: 'PUT',
    url: requestUrl,
  })

const verifyGet = (requestUrl: string) =>
  superagent.post(`${url}/requests/count`).send({
    method: 'GET',
    url: requestUrl,
  })

const getFor = ({ body, urlPattern = undefined, urlPath }: { body: object; urlPattern?: string; urlPath?: string }) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern,
      urlPath,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: body,
    },
  })

const postFor = ({ body, urlPattern, urlPath }: { body: object; urlPattern?: string; urlPath?: string }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern,
      urlPath,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: body,
    },
  })

export {
  stubFor,
  stubScenario,
  getRequests,
  getMatchingRequests,
  resetStubs,
  getFor,
  postFor,
  verifyPosts,
  verifyPut,
  verifyGet,
  resetStub,
}
