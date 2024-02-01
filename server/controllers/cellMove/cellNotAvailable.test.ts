import cellNotAvailable from './cellNotAvailable'

describe('Cell not available', () => {
  const res = { locals: {} as any, redirect: {} as any, render: {} as any, status: {} as any }
  let req
  let controller

  const systemClientToken = 'system_token'

  beforeEach(() => {
    res.redirect = jest.fn()
    res.render = jest.fn()
    res.status = jest.fn()
    res.locals = {
      user: {
        activeCaseLoad: { caseLoadId: 'LEI' },
        allCaseloads: [{ caseLoadId: 'LEI' }],
        userRoles: ['ROLE_CELL_MOVE'],
      },
      systemClientToken,
    }

    controller = cellNotAvailable()

    req = {
      originalUrl: 'http://localhost',
      params: {
        offenderNo: 'A12345',
      },
      query: {
        cellDescription: 'Location 1',
      },
    }
  })

  it('should redirect back to select cell page when no cellDescription is available', async () => {
    req.query = {}
    await controller(req, res)

    expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/select-cell')
  })

  it('should render page with the correct view model', async () => {
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith('cellMove/cellNotAvailable.njk', {
      header: 'Cell Location 1 is no longer available',
      selectCellUrl: `/prisoner/A12345/cell-move/select-cell`,
    })
  })
})
