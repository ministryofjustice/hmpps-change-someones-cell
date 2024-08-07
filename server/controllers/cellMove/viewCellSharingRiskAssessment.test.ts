import viewCellSharingRiskAssessmentDetails from './viewCellSharingAssessmentDetails'
import LocationService from '../../services/locationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import config from '../../config'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/locationService')
jest.mock('../../services/prisonerDetailsService')

describe('view CSRA details', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'
  const systemClientToken = 'system_token'

  const getDetailsResponse = {
    bookingId: 1234,
    firstName: 'Test',
    lastName: 'User',
    assignedLivingUnit: {
      description: 'A-1-12',
    },
  }

  beforeEach(() => {
    req = {
      originalUrl: 'http://localhost',
      params: { offenderNo },
      query: {},
      protocol: 'http',
      headers: {},
      get: jest.fn().mockReturnValue('localhost'),
    }
    res = {
      locals: {
        user: {
          activeCaseLoad: { caseLoadId: 'LEI' },
          allCaseloads: [{ caseLoadId: 'LEI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
      },
      render: jest.fn(),
      status: jest.fn(),
    }

    prisonerDetailsService.getDetails = jest.fn().mockResolvedValue(getDetailsResponse)
    prisonerDetailsService.getCsraAssessments = jest.fn().mockResolvedValue([
      {
        bookingId: 1234,
        offenderNo,
        classificationCode: 'HI',
        classification: 'High',
        assessmentCode: 'CSRF',
        assessmentDescription: 'CSR Full',
        cellSharingAlertFlag: true,
        assessmentDate: '2020-08-27',
        nextReviewDate: '2020-08-29',
        approvalDate: '2020-08-28',
        assessmentAgencyId: 'MDI',
        assessmentStatus: 'A',
        assessmentSeq: 1,
        assessmentComment: 'Some comment for full assessment',
        assessorId: 1,
        assessorUser: 'TEST_USER',
      },
      {
        bookingId: 1234,
        offenderNo,
        classificationCode: 'STANDARD',
        classification: 'Standard',
        assessmentCode: 'CSR',
        assessmentDescription: 'CSR Rating',
        cellSharingAlertFlag: true,
        assessmentDate: '2020-08-17',
        nextReviewDate: '2020-08-19',
        approvalDate: '2020-08-18',
        assessmentAgencyId: 'MDI',
        assessmentStatus: 'A',
        assessmentSeq: 1,
        assessmentComment: 'Some comment',
        assessorId: 1,
        assessorUser: 'TEST_USER',
      },
    ])
    locationService.getAgencyDetails = jest.fn().mockResolvedValue({
      description: 'HMP Moorland',
    })

    controller = viewCellSharingRiskAssessmentDetails({ locationService, prisonerDetailsService })
  })

  it('Makes the expected API calls', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, offenderNo, true)
    expect(prisonerDetailsService.getCsraAssessments).toHaveBeenCalledWith(systemClientToken, [offenderNo])
    expect(locationService.getAgencyDetails).toHaveBeenCalledWith(systemClientToken, 'MDI')
  })

  it('Should render error template when there is an API error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getDetails.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrowError(error)

    expect(res.locals.redirectUrl).toBe('/prisoner/ABC123/cell-move/search-for-cell')
    expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/ABC123`)
  })

  it('populates the data correctly', async () => {
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/cellSharingRiskAssessmentDetails.njk',
      expect.objectContaining({
        prisonerName: 'User, Test',
        cellLocation: 'A-1-12',
        location: 'HMP Moorland',
        comment: 'Some comment for full assessment',
        date: '27 August 2020',
        level: 'High',
        backLink: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        backLinkText: 'Return to search for a cell',
      }),
    )
  })

  it('sets the back link and text correctly when referer data is present', async () => {
    req = { ...req, session: { referrerUrl: `/prisoner/${offenderNo}/cell-move/select-cell` } }
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/cellSharingRiskAssessmentDetails.njk',
      expect.objectContaining({
        backLink: `/prisoner/${offenderNo}/cell-move/select-cell`,
        backLinkText: 'Return to select an available cell',
      }),
    )
  })
})
