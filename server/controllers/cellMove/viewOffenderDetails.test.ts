import config from '../../config'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import viewOffenderDetails from './viewOffenderDetails'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/prisonerDetailsService')

describe('view offender details', () => {
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'

  const getDetailsResponse = {
    bookingId: 1234,
    firstName: 'Test',
    lastName: 'User',
    age: 21,
    religion: 'Some religion',
    assignedLivingUnit: {
      description: 'A-1-12',
    },
    physicalAttributes: {
      ethnicity: 'White',
      raceCode: 'W1',
    },
    profileInformation: [
      { type: 'SEXO', resultValue: 'Heterosexual' },
      { type: 'SMOKE', resultValue: 'No' },
    ],
  }

  const systemClientToken = 'system_token'

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
    prisonerDetailsService.getMainOffence = jest.fn().mockResolvedValue([
      {
        offenceDescription: '13 hours over work',
      },
    ])

    controller = viewOffenderDetails({ prisonerDetailsService })
  })

  it('Makes the expected API calls', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, offenderNo, true)
    expect(prisonerDetailsService.getMainOffence).toHaveBeenCalledWith(systemClientToken, 1234)
  })

  it('Should render error template when there is an API error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getDetails.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrowError(error)

    expect(res.locals.redirectUrl).toBe('/prisoner/ABC123/cell-move/search-for-cell')
    expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/ABC123`)
  })

  it('populates the data correctly when all present', async () => {
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/offenderDetails.njk',
      expect.objectContaining({
        prisonerName: 'User, Test',
        age: 21,
        religion: 'Some religion',
        offenderNo,
        cellLocation: 'A-1-12',
        ethnicity: 'White (W1)',
        sexualOrientation: 'Heterosexual',
        smokerOrVaper: 'No',
        mainOffence: '13 hours over work',
        backLink: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        backLinkText: 'Return to search for a cell',
        profileUrl: `http://localhost:3000/prisoner/${offenderNo}`,
      }),
    )
  })

  it('populates the data correctly when optional missing', async () => {
    prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
      ...getDetailsResponse,
      profileInformation: [],
      age: undefined,
      physicalAttributes: {},
      religion: undefined,
    })
    prisonerDetailsService.getMainOffence = jest.fn().mockResolvedValue([])
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/offenderDetails.njk',
      expect.objectContaining({
        prisonerName: 'User, Test',
        age: 'Not entered',
        religion: 'Not entered',
        offenderNo,
        cellLocation: 'A-1-12',
        ethnicity: 'Not entered',
        sexualOrientation: 'Not entered',
        smokerOrVaper: 'Not entered',
        mainOffence: 'Not entered',
        backLink: `/prisoner/${offenderNo}/cell-move/search-for-cell`,
        backLinkText: 'Return to search for a cell',
        profileUrl: `http://localhost:3000/prisoner/${offenderNo}`,
      }),
    )
  })

  it('shows a full description of the location when in a temporary location', async () => {
    prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
      ...getDetailsResponse,
      assignedLivingUnit: {
        ...getDetailsResponse.assignedLivingUnit,
        description: 'CSWAP',
      },
    })
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/offenderDetails.njk',
      expect.objectContaining({
        cellLocation: 'No cell allocated',
      }),
    )
  })

  it('sets the back link and text correctly when referer data is present', async () => {
    req = { ...req, session: { referrerUrl: `/prisoner/${offenderNo}/cell-move/select-cell` } }
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/offenderDetails.njk',
      expect.objectContaining({
        backLink: `/prisoner/${offenderNo}/cell-move/select-cell`,
        backLinkText: 'Return to select an available cell',
      }),
    )
  })
})
