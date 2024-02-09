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

  describe('when there is a returnUrl set in session', () => {
    beforeEach(() => {
      req.session.returnUrl = '/url-to-return-to'
    })

    it('should redirect to the returnUrl specified', async () => {
      await controller(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/url-to-return-to')
    })

    it('should remove the returnUrl from the session', async () => {
      await controller(req, res)

      expect(req.session).toEqual({})
    })
  })
})
