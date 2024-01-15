import querystring from 'querystring'

import { createClient } from 'redis'
import { promisify } from 'util'
import clientFactory from './oauthEnabledClient'
import logger from '../../logger'
import { oauthApiFactory } from './oauthApi'
import config from '../config'

let getRedisAsync
let setRedisAsync
let oauthClient
let logDebug

export const getSystemOauthApiClient = (configData: typeof config) => {
  return oauthApiFactory(
    clientFactory({
      baseUrl: configData.apis.hmppsAuth.url,
      timeout: configData.apis.hmppsAuth.timeout.deadline * 1000,
    }),
    {
      clientId: configData.apis.hmppsAuth.systemClientId,
      clientSecret: configData.apis.hmppsAuth.systemClientSecret,
      url: configData.apis.hmppsAuth.url,
    },
  )
}

const redisUrl = ({ app, redis }) => {
  const scheme = app.production ? 'rediss' : 'redis'
  const { host, port } = redis
  return `${scheme}://${host}:${port}`
}

export const getTokenStore = ({ app, redis }) => {
  const { enabled, host, password } = redis
  if (!enabled || !host) return null

  const client = createClient({
    url: redisUrl(app),
    password,
  })

  client.on('error', (e: Error) => logger.error(e, 'Redis client error'))

  logger.info(`Oauth token store created`)
  return client
}

export const enableLogDebugStatements = configData => {
  return !configData.app?.production || configData.phaseName === 'DEV'
}

export const clientCredsSetup = (tokenStore, oauthApi, logDebugStatements) => {
  const redisTokenStore = tokenStore
  getRedisAsync = redisTokenStore ? promisify(redisTokenStore?.get).bind(redisTokenStore) : _key => {}
  setRedisAsync = redisTokenStore
    ? promisify(redisTokenStore?.set).bind(redisTokenStore)
    : (_key, _value, _command, _expiry) => {}

  oauthClient = oauthApi

  logDebug = logDebugStatements
}

const requestClientCredentials = async username => {
  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  const oauthResult = await oauthClient.makeTokenRequest(oauthRequest, 'PSH-client_credentials')

  logger.debug(`Oauth request for grant type 'client_credentials', result status: successful`)
  return oauthResult
}

// Remove this when we are confident caching is working
const debug = (operation: string, username: string) => {
  if (logDebug) logger.info(`OAUTH CLIENT CREDS ${operation} FOR ${username}`)
}

const getKey = (username: string): string => {
  const baseKey = username || '%ANONYMOUS%'
  return `CC_${baseKey}`
}

export const getClientCredentialsTokens = async username => {
  const key = getKey(username)

  debug('GET', key)
  const token = await getRedisAsync(key)
  if (token) {
    debug('GOT', key)
    // We need to preserve the oauth result to avoid changing all the code and esp. tests (we use axios).
    // According to axios-config-decorators.ts we only use the auth token, custom request headers and pagination.
    // For client creds, pagination and custom headers are not relevant when getting client creds.
    return {
      // Need only access token - refresh token and authSource (as per useApiClientCreds.ts) are actually not used
      // for client creds (the access functions are in contextProperties.ts)
      access_token: token,
      refresh_token: null,
    }
  }

  const oauthResult = await requestClientCredentials(username)

  // set TTL slightly less than expiry of token. Async but no need to wait
  await setRedisAsync(key, oauthResult.access_token, 'EX', oauthResult.expires_in - 60)
  debug(`SET-${oauthResult.expires_in}`, key)

  return oauthResult
}

export default {
  getClientCredentialsTokens,
}
