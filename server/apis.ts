import clientFactory from './api/oauthEnabledClient'

import config from './config'
import { prisonApiFactory } from './api/prisonApi'

export const prisonApi = prisonApiFactory(
  clientFactory({
    baseUrl: config.apis.prisonApi.url,
    timeout: config.apis.prisonApi.timeoutSeconds * 1000,
  }),
)

export default {
  prisonApi,
}
