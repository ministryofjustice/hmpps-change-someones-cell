import confirmReceptionMove from './confirmReceptionMove'
import logger from '../../../logger'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { OffenderCell, ReferenceCode } from '../../data/prisonApiClient'

jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

describe('Confirm reception move', () => {
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  logger.info = jest.fn()
  logger.error = jest.fn()

  let controller

  const systemClientToken = 'system_token'

  const req = {
    originalUrl: 'http://localhost',
    params: { offenderNo: 'A12345' },
    query: {},
    headers: { referer: '' },
    flash: jest.fn(),
    body: {},
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
    flash: jest.fn(),
  }

  const reception: OffenderCell = {
    id: 6352,
    description: 'LEI-RECP',
    userDescription: 'LEI-RECP',
    capacity: 100,
    noOfOccupants: 2,
    attributes: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
      bookingId: 1,
      firstName: 'Bob',
      lastName: 'Doe',
      agencyId: 'MDI',
    })

    prisonerCellAllocationService.getCellMoveReasonTypes = jest.fn().mockResolvedValue([
      {
        activeFlag: 'N',
        code: 'ADM',
        domain: 'CHG_HOUS_RSN',
        description: 'Administrative',
      },
      {
        activeFlag: 'N',
        code: 'BEH',
        description: 'Behaviour',
      },
    ])

    req.params = {
      offenderNo: 'A12345',
    }

    controller = confirmReceptionMove({ prisonerCellAllocationService, prisonerDetailsService })
  })

  describe('view', () => {
    it('Should get prisoner details', async () => {
      await controller.view(req, res)
      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345', false)
    })

    it('Should set backUrl to the previous page', async () => {
      req.headers.referer = '/prisoner/A12345/reception-move/consider-risks-reception'
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/confirmReceptionMove.njk',
        expect.objectContaining({ backUrl: '/prisoner/A12345/reception-move/consider-risks-reception' }),
      )
    })
    it('Should set backUrl to null', async () => {
      req.headers.referer = null
      await controller.view(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/confirmReceptionMove.njk',
        expect.objectContaining({ backUrl: null }),
      )
    })

    it('Should include correct radio options in render data', async () => {
      const receptionMoveTypes: ReferenceCode[] = [
        {
          code: 'ADM',
          description: 'Administrative',
          activeFlag: 'N',
          domain: 'CHG_HOUS_RSN',
        },
        {
          code: 'GM',
          description: 'General moves',
          activeFlag: 'Y',
          domain: 'CHG_HOUS_RSN',
        },
      ]
      prisonerCellAllocationService.getCellMoveReasonTypes.mockResolvedValue(receptionMoveTypes)
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/confirmReceptionMove.njk',
        expect.objectContaining({
          receptionMoveReasonRadioValues: [
            {
              checked: false,
              text: 'General moves',
              value: 'GM',
            },
          ],
        }),
      )
    })

    it('Should include user input errors in render data', async () => {
      const formValues = [
        {
          comment: undefined,
        },
      ]

      const errors = [
        {
          href: '#reason',
          text: 'Select a reason for the move',
        },
        {
          href: '#comment',
          text: 'Explain why the person is being moved to reception',
        },
      ]

      req.flash.mockReturnValueOnce(formValues)
      req.flash.mockReturnValueOnce(errors)

      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/confirmReceptionMove.njk',
        expect.objectContaining({
          errors: [
            { href: '#reason', text: 'Select a reason for the move' },
            { href: '#comment', text: 'Explain why the person is being moved to reception' },
          ],
          formValues: { comment: undefined },
        }),
      )
    })
    it('should render complete set of render data', async () => {
      req.headers.referer = '/prisoner/A12345/reception-move/consider-risks-reception'
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith('receptionMove/confirmReceptionMove.njk', {
        backUrl: '/prisoner/A12345/reception-move/consider-risks-reception',
        cancelLinkHref: '/prisoner/A12345/location-details',
        errors: undefined,
        formValues: { comment: undefined },
        offenderName: 'Bob Doe',
        offenderNo: 'A12345',
        receptionMoveReasonRadioValues: [],
      })
    })
  })

  describe('post', () => {
    it('should call flash with input values', async () => {
      req.body = {
        reason: 'GM',
        comment: 'my comments',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([])
      await controller.post(req, res)
      expect(req.flash).toHaveBeenCalledWith('formValues', { comment: 'my comments', reason: 'GM' })
    })

    it('should call upstream services correctly', async () => {
      req.body = {
        reason: 'GM',
        comment: 'my comments',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([reception])

      await controller.post(req, res)
      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12345', true)
      expect(prisonerCellAllocationService.moveToCell).toHaveBeenCalledWith(
        systemClientToken,
        1,
        'A12345',
        'LEI-RECP',
        'GM',
        'my comments',
      )
    })

    it('should call flash if no user inputs', async () => {
      req.body = {}
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([])
      await controller.post(req, res)

      expect(req.flash).toHaveBeenNthCalledWith(1, 'formValues', {})
      expect(req.flash).toHaveBeenNthCalledWith(2, 'errors', [
        { href: '#reason', text: 'Select a reason for the move' },
        { href: '#comment', text: 'Explain why the person is being moved to reception' },
      ])

      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/A12345/reception-move/confirm-reception-move`)
    })
    it('should call flash if comments below the minimum size limit', async () => {
      req.body = {
        reason: 'GM',
        comment: 'abc',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([reception])

      await controller.post(req, res)
      expect(req.flash).toHaveBeenNthCalledWith(1, 'formValues', { comment: 'abc', reason: 'GM' })
      expect(req.flash).toHaveBeenNthCalledWith(2, 'errors', [
        { href: '#comment', text: 'Provide more detail about why this person is being moved to reception' },
      ])
    })
    it('should redirect to prison-full', async () => {
      req.body = {
        reason: 'GM',
        comment: 'my comments',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([])
      await controller.post(req, res)

      expect(logger.info).toBeCalled()
      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/A12345/reception-move/reception-full`)
    })

    it('should redirect to /confirmation', async () => {
      req.body = {
        reason: 'GM',
        comment: 'my comments',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([reception])

      await controller.post(req, res)

      expect(req.flash).toHaveBeenCalledTimes(1)
      expect(res.redirect).toHaveBeenCalledWith('/prisoner/A12345/reception-move/confirmation')
    })

    it('should redirect to /consider-risks-reception', async () => {
      const error = new Error('network error')
      req.body = {
        reason: 'GM',
        comment: 'my comments',
      }

      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([reception])
      prisonerCellAllocationService.moveToCell.mockRejectedValue(error)

      await expect(controller.post(req, res)).rejects.toThrowError(error)

      expect(logger.error).toBeCalled()
      expect(res.locals.redirectUrl).toBe('/prisoner/A12345/reception-move/consider-risks-reception')
    })

    it('should call flash if comments below a minimum size', async () => {
      req.body = {
        reason: 'GM',
        comment: 'abc',
      }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([reception])

      await controller.post(req, res)
      expect(req.flash).toHaveBeenNthCalledWith(1, 'formValues', { comment: 'abc', reason: 'GM' })
      expect(req.flash).toHaveBeenNthCalledWith(2, 'errors', [
        { href: '#comment', text: 'Provide more detail about why this person is being moved to reception' },
      ])
    })
  })
})
