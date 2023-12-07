import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { MockUserService } from '../tests/testUtils'

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
    services: { userService: new MockUserService() },
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
