import config from '../config'
import RestClient from './restClient'

/**
 * The prison as prison-register holds it. Only the fields this service reads are modelled;
 * the register returns much more (types, categories, operators, addresses).
 */
export interface Prison {
  prisonId: string
  prisonName: string
  active: boolean
}

/**
 * Reads prison reference data from prison-register - the source of truth for prisons across
 * HMPPS, replacing the prison-api agency lookup as part of getting this service off prison-api.
 * The register's read endpoints require no role.
 */
export default class PrisonRegisterApiClient {
  constructor() {}

  private static restClient(token: string): RestClient {
    return new RestClient('Prison Register API Client', config.apis.prisonRegisterApi, token)
  }

  getPrisonById(token: string, prisonId: string) {
    return PrisonRegisterApiClient.restClient(token).get<Prison>({
      path: `/prisons/id/${prisonId}`,
    })
  }
}
