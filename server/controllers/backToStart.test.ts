import config from '../config'
import backToStart from './backToStart'

describe('Back to start url', () => {
  let req
  let res
  let controller

  beforeEach(() => {
    req = {
      session: {},
    }
    res = {
      locals: {},
      redirect: jest.fn(),
    }

    controller = backToStart()
  })

  it('should redirect home by default', async () => {
    await controller(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/')
  })

  describe('when a returnToService of prisonerProfile is set in the session', () => {
    beforeEach(() => {
      req.session.returnToService = 'prisonerProfile'
    })

    it('should redirect to the prisoner profile', async () => {
      await controller(req, res)

      expect(res.redirect).toHaveBeenCalledWith(config.prisonerProfileUrl)
    })

    it('should redirect to a specific prisoner profile if specified', async () => {
      const offenderNo = 'AB1234C'

      await controller({ ...req, query: { serviceUrlParams: { offenderNo } } }, res)

      expect(res.redirect).toHaveBeenCalledWith(`${config.prisonerProfileUrl}/prisoner/${offenderNo}`)
    })

    it('should remove the returnToService from the session', async () => {
      await controller(req, res)

      expect(req.session).toEqual({})
    })
  })
})
