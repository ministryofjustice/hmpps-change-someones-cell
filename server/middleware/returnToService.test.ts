import returnToService from './returnToService'

describe('Return to service', () => {
  const res = {}
  let req
  let next
  let controller

  beforeEach(() => {
    req = { session: {}, query: {} }
    next = jest.fn()

    controller = returnToService()
  })

  it('should not set a returnToService in session by default', async () => {
    await controller(req, res, next)

    expect(req.session.returnToService).toEqual(undefined)
    expect(next).toHaveBeenCalled()
  })

  describe('when there is a returnToService query parameter', () => {
    it('should set returnToService in session', async () => {
      req.query.returnToService = 'prisonerProfile'

      await controller(req, res, next)

      expect(req.session.returnToService).toEqual('prisonerProfile')
      expect(next).toHaveBeenCalled()
    })
  })
})
