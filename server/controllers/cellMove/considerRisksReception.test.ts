import considerRisksReception from './considerRisksReception'
import logger from '../../../logger'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { Assessment } from '../../data/prisonApiClient'
import config from '../../config'

jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

const someOffenderNumber = 'A12345'
const someBookingId = -10
const someAgency = 'LEI'

logger.info = jest.fn()

const systemClientToken = 'system_token'

const res = {
  locals: {
    homeUrl: `prisoner/${someOffenderNumber}`,
    user: {
      activeCaseLoad: { caseLoadId: 'MDI' },
      allCaseloads: [{ caseLoadId: 'MDI' }],
      userRoles: ['ROLE_CELL_MOVE'],
    },
    systemClientToken,
  },
  redirect: jest.fn(),
  render: jest.fn(),
}
let controller
let req

const assessment: Assessment = {
  bookingId: 123456,
  offenderNo: 'GV09876N',
  classificationCode: 'C',
  classification: 'Cat C',
  assessmentCode: 'CATEGORY',
  assessmentDescription: 'Categorisation',
  cellSharingAlertFlag: true,
  assessmentDate: '2018-02-11',
  nextReviewDate: '2018-02-11',
  approvalDate: '2018-02-11',
  assessmentAgencyId: 'MDI',
  assessmentStatus: 'A',
  assessmentSeq: 1,
  assessmentComment: 'Comment details',
  assessorId: 130000,
  assessorUser: 'NGK33Y',
}

const prisonerDetails = {
  offenderNo: someOffenderNumber,
  bookingId: someBookingId,
  firstName: 'John',
  lastName: 'Doe',
  csra: 'High',
  csraClassificationCode: 'HI',
  agencyId: 'MDI',
  categoryCode: 'A',
  assessments: [],
  assignedLivingUnit: {
    agencyId: 'BXI',
    locationId: 5432,
    description: '1-1-001',
    agencyName: 'Brixton (HMP)',
  },
  dateOfBirth: '1990-10-12',
  age: 29,
  assignedLivingUnitId: 5432,
  assignedLivingUnitDesc: '1-1-001',
  alertsDetails: ['X', 'XEL', 'XGANG', 'PEEP', 'XTACT', 'V', 'H', 'R'],
  alertsCodes: ['X', 'XEL', 'XGANG', 'PEEP', 'XTACT', 'V', 'H', 'R'],
  alerts: [],
  profileInformation: [],
}

describe('Consider risks reception', () => {
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerCellAllocationService = jest.mocked(
    new PrisonerCellAllocationService(undefined, undefined, undefined, undefined),
  )
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  beforeEach(() => {
    prisonerDetailsService.getDetails.mockResolvedValue(prisonerDetails)
    prisonerDetailsService.getCsraAssessments.mockResolvedValue([assessment])
    prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([
      {
        id: 123,
        description: 'ABC-1-RECEP',
        capacity: 10,
        noOfOccupants: 9,
        attributes: [],
      },
    ])

    prisonerCellAllocationService.getOffendersInReception.mockResolvedValue([])
    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({ nonAssociations: [] })

    res.render = jest.fn()

    res.locals.user = {
      activeCaseLoad: { caseLoadId: 'MDI' },
      allCaseloads: [{ caseLoadId: 'MDI' }],
      userRoles: ['ROLE_CELL_MOVE'],
    }

    req = {
      originalUrl: 'original-url',
      params: {
        offenderNo: someOffenderNumber,
      },
      flash: jest.fn(),
      query: {},
      session: {
        userDetails: {
          activeCaseLoadId: someAgency,
        },
      },
    }

    controller = considerRisksReception({
      nonAssociationsService,
      prisonerCellAllocationService,
      prisonerDetailsService,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('page', () => {
    it('should make the correct api calls', async () => {
      await controller.view(req, res)
      expect(prisonerDetailsService.getDetails).toHaveBeenNthCalledWith(1, systemClientToken, someOffenderNumber, true)
      expect(prisonerDetailsService.getCsraAssessments).toHaveBeenCalledWith(systemClientToken, [someOffenderNumber])
      expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, someOffenderNumber)
    })

    it('should redirect if reception already full', async () => {
      req.body = { considerRisksReception: 'yes' }
      prisonerCellAllocationService.getReceptionsWithCapacity.mockResolvedValue([])
      await controller.view(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${someOffenderNumber}/reception-move/reception-full`)
      expect(logger.info).toHaveBeenCalledWith('Can not move to reception as already full to capacity')
    })

    it('should check user has correct roles', async () => {
      res.locals.user.userRoles = ['ROLE_SOMETHING_ELSE']
      await controller.view(req, res)
      expect(res.render).toHaveBeenCalledWith('notFound.njk', { url: '/prisoner-search' })
      expect(logger.info).toHaveBeenCalledWith('User does not have correct roles')
    })

    it('should populate view model with prisoner details', async () => {
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/considerRisksReception.njk',
        expect.objectContaining({
          prisonerAlerts: [],
          prisonerDetails,
          reverseOrderPrisonerName: 'Doe, John',
          nonAssociationsRows: [],
          offendersInReception: [],
          inReceptionCount: '0 people in reception',
        }),
      )
    })
    it('should use singular description when only one person in reception', async () => {
      prisonerCellAllocationService.getOffendersInReception.mockResolvedValue([
        {
          offenderNo: 'B123',
          firstName: 'Jack',
          lastName: 'Simpson',
          bookingId: 323,
          dateOfBirth: '2002-01-02',
          alerts: [],
        },
      ])
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/considerRisksReception.njk',
        expect.objectContaining({
          inReceptionCount: '1 person in reception',
          offendersInReception: [
            {
              alerts: [],
              csraClassification: 'Not entered',
              displayCsraLink: undefined,
              name: 'Simpson, Jack',
              nonAssociation: false,
              offenderNo: 'B123',
            },
          ],
        }),
      )
    })
    it('should populate view model with other prisoners in reception', async () => {
      prisonerCellAllocationService.getOffendersInReception.mockResolvedValue([
        {
          offenderNo: 'A123',
          firstName: 'Max',
          lastName: 'Mercedes',
          bookingId: 123,
          dateOfBirth: '2002-01-01',
          alerts: [],
        },
        {
          offenderNo: 'B123',
          firstName: 'Jack',
          lastName: 'Simpson',
          bookingId: 323,
          dateOfBirth: '2002-01-02',
          alerts: [],
        },
      ])
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/considerRisksReception.njk',
        expect.objectContaining({
          inReceptionCount: '2 people in reception',
          offendersInReception: [
            {
              alerts: [],
              csraClassification: 'Not entered',
              displayCsraLink: undefined,
              name: 'Mercedes, Max',
              nonAssociation: false,
              offenderNo: 'A123',
            },
            {
              alerts: [],
              csraClassification: 'Not entered',
              displayCsraLink: undefined,
              name: 'Simpson, Jack',
              nonAssociation: false,
              offenderNo: 'B123',
            },
          ],
        }),
      )
    })

    it('should populate view model with correct urls', async () => {
      prisonerDetailsService.getCsraAssessments.mockResolvedValue([
        { ...assessment, assessmentDate: ' 2020-10-10T10:00', assessmentComment: 'comment 1' },
      ])
      await controller.view(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'receptionMove/considerRisksReception.njk',
        expect.objectContaining({
          backUrl: `${config.prisonerProfileUrl}/prisoner/A12345/location-details`,
          csraDetailsUrl: '/prisoner/A12345/cell-move/cell-sharing-risk-assessment-details',
          displayLinkToPrisonersMostRecentCsra: 'comment 1',
          nonAssociationLink: '/prisoner/A12345/cell-move/non-associations',
          offenderDetailsUrl: '/prisoner/A12345/cell-move/prisoner-details',
          searchForCellRootUrl: '/prisoner/A12345/cell-move/search-for-cell',
        }),
      )
    })

    it('should get csra assessments only once if no other prisoners in reception', async () => {
      prisonerCellAllocationService.getOffendersInReception.mockResolvedValue([])
      await controller.view(req, res)
      expect(prisonerDetailsService.getCsraAssessments).toHaveBeenCalledTimes(1)
    })

    it('should not flash errors', async () => {
      req.body = { considerRisksReception: 'yes' }
      await controller.submit(req, res)
      expect(req.flash).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${someOffenderNumber}/reception-move/confirm-reception-move`)
    })
    it('should flash errors', async () => {
      req.body = {}
      await controller.submit(req, res)
      expect(req.flash).toHaveBeenCalledWith('errors', [{ href: '#considerRisksReception', text: 'Select yes or no' }])
      expect(res.redirect).toHaveBeenCalledWith(
        `/prisoner/${someOffenderNumber}/reception-move/consider-risks-reception`,
      )
    })

    it('should redirect to previous page', async () => {
      req.body = { considerRisksReception: 'no' }
      await controller.submit(req, res)
      expect(res.redirect).toHaveBeenCalledWith(
        `${config.prisonerProfileUrl}/prisoner/${someOffenderNumber}/location-details`,
      )
    })

    it('should throw error when call to upstream api rejects', async () => {
      const error = new Error('Network error')
      prisonerDetailsService.getCsraAssessments.mockRejectedValue(error)
      await expect(controller.view(req, res)).rejects.toThrow(error)
      expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/${someOffenderNumber}`)
    })
  })
})
