import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { defaultServices } from '../tests/testUtils'

let app: Express

const user: Express.User = {
  token: 'dfvbuliagwer',
  authSource: 'NOMIS',
  activeCaseLoad: {
    caseLoadId: 'AZK',
    description: 'Azkaban',
    currentlyActive: true,
  },
}

beforeEach(() => {
  app = appWithAllRoutes({
    services: defaultServices,
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect(res => {
        expect(res.text).toContain('Change someone’s cell')
      })
  })
})
