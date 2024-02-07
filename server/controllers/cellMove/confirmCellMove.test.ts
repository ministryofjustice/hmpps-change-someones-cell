import confirmCellMove from './confirmCellMove'
import { makeError } from '../../tests/testUtils'
import AnalyticsService from '../../services/analyticsService'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'

jest.mock('../../services/analyticsService')
jest.mock('../../services/locationService')
jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

describe('Change cell play back details', () => {
  const analyticsService = jest.mocked(new AnalyticsService(undefined))
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let controller

  const systemClientToken = 'system_token'

  const req = {
    originalUrl: 'http://localhost',
    params: { offenderNo: 'A12345' },
    query: {},
    headers: {},
    flash: jest.fn(),
    body: {},
    cookies: {
      _ga: 'GA1.1.123456.7654321',
    },
  }

  const res = {
    locals: {
      user: {
        activeCaseLoad: { caseLoadId: 'LEI' },
        allCaseloads: [{ caseLoadId: 'LEI' }],
        userRoles: ['ROLE_CELL_MOVE'],
      },
      systemClientToken,
      redirectUrl: '',
      homeUrl: '',
    },
    status: jest.fn(),
    render: jest.fn(),
    redirect: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
      bookingId: 1,
      firstName: 'Bob',
      lastName: 'Doe',
      agencyId: 'MDI',
    })
    prisonerCellAllocationService.moveToCell = jest.fn()
    prisonerCellAllocationService.moveToCellSwap = jest.fn()
    locationService.getLocation = jest.fn().mockResolvedValue({
      locationPrefix: 'MDI-10-19',
      description: 'MDI-10',
    })

    locationService.getAttributesForLocation = jest.fn().mockResolvedValue({ capacity: 1 })
    prisonerCellAllocationService.getCellMoveReasonTypes = jest.fn().mockResolvedValue([])

    analyticsService.sendEvents = jest.fn().mockResolvedValue(Promise.resolve({}))

    controller = confirmCellMove({
      analyticsService,
      locationService,
      prisonerCellAllocationService,
      prisonerDetailsService,
    })

    req.params = {
      offenderNo: 'A12345',
    }

    res.render = jest.fn()
    res.redirect = jest.fn()
    req.flash = jest.fn()
  })

  describe('Index', () => {
    it('should redirect back to select cell page when location description is missing', async () => {
      await controller.index(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/select-cell')
    })

    it('should make a request for the location and booking details', async () => {
      req.query = {
        cellId: 233,
      }

      await controller.index(req, res)

      expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 233)
      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345')
    })

    it('should render play back details page', async () => {
      req.query = { cellId: 223 }

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith('cellMove/confirmCellMove.njk', {
        backLink: '/prisoner/A12345/cell-move/search-for-cell',
        backLinkText: 'Cancel',
        errors: undefined,
        formValues: {
          comment: undefined,
          reason: undefined,
        },
        breadcrumbPrisonerName: 'Doe, Bob',
        cellId: 223,
        cellMoveReasonRadioValues: [],
        movingToHeading: 'to cell MDI-10',
        locationPrefix: 'MDI-10-19',
        name: 'Bob Doe',
        offenderNo: 'A12345',
        showCommentInput: true,
        showWarning: true,
      })
    })

    it('should not make a request for the location details when the cell is C-SWAP', async () => {
      req.query = { cellId: 'C-SWAP' }

      await controller.index(req, res)

      expect(locationService.getLocation.mock.calls.length).toBe(0)
    })

    it('should render view model with C-SWAP title and warnings disabled', async () => {
      req.query = { cellId: 'C-SWAP' }

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith('cellMove/confirmCellMove.njk', {
        backLink: '/prisoner/A12345/cell-move/search-for-cell',
        backLinkText: 'Cancel',
        breadcrumbPrisonerName: 'Doe, Bob',
        cellId: 'C-SWAP',
        cellMoveReasonRadioValues: undefined,
        movingToHeading: 'out of their current location',
        errors: undefined,
        formValues: {
          comment: undefined,
        },
        locationPrefix: undefined,
        name: 'Bob Doe',
        offenderNo: 'A12345',
        showCommentInput: false,
        showWarning: false,
      })
    })

    it('should not make a request for case note types when moving to C-SWAP', async () => {
      req.query = { cellId: 'C-SWAP' }

      await controller.index(req, res)

      expect(prisonerCellAllocationService.getCellMoveReasonTypes.mock.calls.length).toBe(0)
    })

    it('should make a request to retrieve all cell move case note types for none c-swap moves', async () => {
      req.query = { cellId: 'A-1-3' }

      prisonerCellAllocationService.getCellMoveReasonTypes.mockResolvedValue([
        {
          domain: 'CHG_HOUS_RSN',
          code: 'ADM',
          description: 'Admin',
          activeFlag: 'Y',
        },
        {
          domain: 'CHG_HOUS_RSN',
          code: 'SA',
          description: 'Safety',
          activeFlag: 'Y',
        },
        {
          domain: 'CHG_HOUS_RSN',
          code: 'UNUSED',
          description: 'Unused value',
          activeFlag: 'N',
        },
      ])

      await controller.index(req, res)

      expect(prisonerCellAllocationService.getCellMoveReasonTypes).toHaveBeenCalledWith(systemClientToken)
      expect(res.render).toHaveBeenCalledWith(
        'cellMove/confirmCellMove.njk',
        expect.objectContaining({
          cellMoveReasonRadioValues: [
            { value: 'ADM', text: 'Admin', checked: false },
            { value: 'SA', text: 'Safety', checked: false },
          ],
        }),
      )
    })

    it('should unpack errors out of req.flash', async () => {
      req.flash.mockImplementation(() => [
        {
          href: '#reason',
          text: 'Select the reason for the cell move',
        },
      ])
      req.query = { cellId: 'A-1-3' }

      await controller.index(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'cellMove/confirmCellMove.njk',
        expect.objectContaining({
          errors: [{ href: '#reason', text: 'Select the reason for the cell move' }],
        }),
      )
    })

    it('should unpack form values out of req.flash', async () => {
      prisonerCellAllocationService.getCellMoveReasonTypes.mockResolvedValue([
        {
          domain: 'CHG_HOUS_RSN',
          code: 'ADM',
          description: 'Admin',
          activeFlag: 'Y',
        },
        {
          domain: 'CHG_HOUS_RSN',
          code: 'SA',
          description: 'Safety',
          activeFlag: 'Y',
        },
      ])
      req.flash.mockImplementation(() => [
        {
          reason: 'ADM',
          comment: 'Hello',
        },
      ])
      req.query = { cellId: 'A-1-3' }

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/confirmCellMove.njk',
        expect.objectContaining({
          cellMoveReasonRadioValues: [
            { checked: true, text: 'Admin', value: 'ADM' },
            { checked: false, text: 'Safety', value: 'SA' },
          ],
          formValues: {
            comment: 'Hello',
          },
        }),
      )
    })

    it('should show cell move reasons in Db order', async () => {
      prisonerCellAllocationService.getCellMoveReasonTypes.mockResolvedValue([
        {
          domain: 'CHG_HOUS_RSN',
          code: 'ADM',
          description: 'Admin',
          listSeq: 2,
          activeFlag: 'Y',
        },
        {
          domain: 'CHG_HOUS_RSN',
          code: 'SA',
          description: 'Safety',
          listSeq: 1,
          activeFlag: 'Y',
        },
      ])
      req.flash.mockImplementation(() => [
        {
          reason: 'ADM',
          comment: 'Hello',
        },
      ])
      req.query = { cellId: 'A-1-3' }

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/confirmCellMove.njk',
        expect.objectContaining({
          cellMoveReasonRadioValues: [
            { checked: false, text: 'Safety', value: 'SA' },
            { checked: true, text: 'Admin', value: 'ADM' },
          ],
          formValues: {
            comment: 'Hello',
          },
        }),
      )
    })

    test.each`
      referer                                         | backLinkText
      ${'/prisoner/A12345/cell-move/select-cell'}     | ${'Select another cell'}
      ${'/prisoner/A12345/cell-move/consider-risks'}  | ${'Select another cell'}
      ${'/prisoner/A12345/cell-move/search-for-cell'} | ${'Cancel'}
      ${'/temporary-move?keywords=A12345'}            | ${'Cancel'}
    `(
      'The back link button content is $backLinkText when the referer is $referer',
      async ({ referer, backLinkText }) => {
        req.headers = { referer }

        await controller.index(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/confirmCellMove.njk',
          expect.objectContaining({
            backLink:
              referer === '/prisoner/A12345/cell-move/consider-risks'
                ? '/prisoner/A12345/cell-move/select-cell'
                : referer,
            backLinkText,
          }),
        )
      },
    )
  })

  describe('Post handle normal cell move', () => {
    beforeEach(() => {
      req.body = { reason: 'ADM', comment: 'Hello world' }
    })

    it('should trigger missing reason validation', async () => {
      req.body = { cellId: 233, comment: 'hello world' }

      await controller.post(req, res)

      expect(req.flash).toHaveBeenCalledWith('errors', [
        {
          href: '#reason',
          text: 'Select the reason for the cell move',
        },
      ])

      expect(req.flash).toHaveBeenCalledWith('formValues', {
        comment: 'hello world',
      })
      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/confirm-cell-move?cellId=233')
    })

    it('should trigger missing comment validation', async () => {
      req.body = { cellId: 233, reason: 'ADM' }

      await controller.post(req, res)

      expect(req.flash).toHaveBeenCalledWith('formValues', { comment: undefined, reason: 'ADM' })
      expect(req.flash).toHaveBeenCalledWith('errors', [
        {
          href: '#comment',
          text: 'Enter what happened for you to change this person’s cell',
        },
      ])

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/confirm-cell-move?cellId=233')
    })

    it('should trigger minimum comment length validation', async () => {
      req.body = { cellId: 233, comment: 'hello', reason: 'ADM' }

      await controller.post(req, res)

      expect(req.flash).toHaveBeenCalledWith('errors', [
        {
          href: '#comment',
          text: 'Enter a real explanation of what happened for you to change this person’s cell',
        },
      ])

      expect(req.flash).toHaveBeenCalledWith('formValues', {
        reason: 'ADM',
        comment: 'hello',
      })
      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/confirm-cell-move?cellId=233')
    })

    it('should trigger the maximum comment length validation', async () => {
      const bigComment = [...Array(40001).keys()].map(() => 'A').join('')

      req.body = { cellId: 233, comment: bigComment, reason: 'ADM' }

      await controller.post(req, res)

      expect(req.flash).toHaveBeenCalledWith('errors', [
        {
          href: '#comment',
          text: 'Enter what happened for you to change this person’s cell using 4,000 characters or less',
        },
      ])

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/confirm-cell-move?cellId=233')
    })

    it('should redirect back to select cell page when location description is missing', async () => {
      await controller.post(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/select-cell')
    })

    it('should call whereabouts api to make the cell move', async () => {
      prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({ bookingId: 1 })
      req.body = { reason: 'BEH', cellId: 223, comment: 'Hello world' }

      await controller.post(req, res)

      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345')
      expect(prisonerCellAllocationService.moveToCell).toHaveBeenCalledWith(
        systemClientToken,
        1,
        'A12345',
        'MDI-10-19',
        'BEH',
        'Hello world',
      )
      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/confirmation?cellId=223')
    })

    it('should store correct redirect and home url then re-throw the error', async () => {
      req.body = { ...req.body, cellId: 223 }
      const offenderNo = 'A12345'
      const error = new Error('network error')

      prisonerDetailsService.getDetails = jest.fn().mockRejectedValue(error)

      await expect(controller.post(req, res)).rejects.toThrowError(error)

      expect(res.locals.redirectUrl).toBe(`/prisoner/${offenderNo}/cell-move/select-cell`)
      expect(res.locals.homeUrl).toBe(`/prisoner/${offenderNo}`)
    })

    it('should raise an analytics event', async () => {
      req.body = { ...req.body, cellId: 223 }

      await controller.post(req, res)
      expect(analyticsService.sendEvents).toHaveBeenCalledWith('123456.7654321', [
        {
          name: 'cell_move',
          params: {
            agency_id: 'MDI',
            cell_type: 'Single occupancy',
          },
        },
      ])
    })

    it('should not raise an analytics event on api failures', async () => {
      const error = new Error('Internal server error')
      prisonerCellAllocationService.moveToCell.mockRejectedValue(error)

      req.body = { ...req.body, cellId: 123 }

      await expect(controller.post(req, res)).rejects.toThrowError(error)

      expect(analyticsService.sendEvents.mock.calls.length).toBe(0)
    })

    it('should redirect to cell not available on a http 400 bad request when attempting a cell move', async () => {
      req.body = { ...req.body, cellId: 223 }

      prisonerCellAllocationService.moveToCell.mockRejectedValue(makeError('status', 400))

      await controller.post(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/cell-not-available?cellDescription=MDI-10')
      expect(analyticsService.sendEvents.mock.calls.length).toBe(0)
    })
  })

  describe('Post handle C-SWAP cell move', () => {
    it('should call elite api to make the C-SWAP cell move', async () => {
      req.body = { cellId: 'C-SWAP' }
      res.locals = {
        user: {
          activeCaseLoad: { caseLoadId: 'LEI' },
          allCaseloads: [{ caseLoadId: 'LEI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
        redirectUrl: '',
        homeUrl: '',
      }

      await controller.post(req, res)

      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345')
      expect(prisonerCellAllocationService.moveToCellSwap).toHaveBeenCalledWith(systemClientToken, 1)
      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/cell-move/space-created')
    })

    it('should raise an analytics event', async () => {
      req.body = { cellId: 'C-SWAP' }

      await controller.post(req, res)

      expect(analyticsService.sendEvents).toHaveBeenCalledWith('123456.7654321', [
        {
          name: 'cell_move',
          params: {
            agency_id: 'MDI',
            cell_type: 'C-SWAP',
          },
        },
      ])
    })

    it('should not raise an analytics event on api failures', async () => {
      const error = new Error('Internal server error')

      prisonerCellAllocationService.moveToCellSwap.mockRejectedValue(error)
      req.body = { cellId: 'C-SWAP' }

      await expect(controller.post(req, res)).rejects.toThrow(error)

      expect(analyticsService.sendEvents.mock.calls.length).toBe(0)
    })
  })
})
