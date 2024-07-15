import moment from 'moment'
import searchForCell from './searchForCell'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import LocationService from '../../services/locationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import { Prisoner } from '../../data/prisonerSearchApiClient'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

describe('select location', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'

  const getDetailsResponse = {
    bookingId: 1234,
    prisonerNumber: offenderNo,
    firstName: 'Test',
    lastName: 'User',
    csra: 'High',
    prisonId: 'MDI',
    alerts: [
      {
        active: true,
        alertCode: 'XRF',
        alertType: 'X',
        expired: false,
      },
      {
        active: true,
        alertCode: 'XGANG',
        alertType: 'X',
        expired: false,
      },
      {
        alertType: 'V',
        alertCode: 'VIP',
        expired: false,
        active: true,
      },
      {
        alertType: 'H',
        alertCode: 'HA',
        expired: false,
        active: true,
      },
      {
        alertType: 'H',
        alertCode: 'HA1',
        expired: false,
        active: true,
      },
    ],
  } as Prisoner

  beforeEach(() => {
    req = {
      originalUrl: 'http://localhost',
      params: { offenderNo },
      query: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost'),
      headers: {},
    }
    res = {
      locals: {
        systemClientToken: 'system_token',
        user: {
          userRoles: ['ROLE_CELL_MOVE'],
          allCaseloads: [
            {
              caseLoadId: 'MDI',
              currentlyActive: true,
              description: 'Moorland (HMP)',
            },
          ],
        },
      },
      render: jest.fn(),
      status: jest.fn(),
    }

    prisonerDetailsService.getPrisoner = jest.fn().mockImplementation((_, requestedOffenderNo) => ({
      ...getDetailsResponse,
      offenderNo: requestedOffenderNo,
    }))

    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({ nonAssociations: [] })

    locationService.searchGroups = jest.fn().mockResolvedValue([
      { name: 'Casu', key: 'Casu', children: [] },
      {
        name: 'Houseblock 1',
        key: 'Houseblock 1',
        children: [],
      },
      {
        name: 'Houseblock 2',
        key: 'Houseblock 2',
      },
      {
        name: 'Houseblock 3',
        key: 'Houseblock 3',
        children: [],
      },
    ])

    controller = searchForCell({ locationService, nonAssociationsService, prisonerDetailsService })
  })

  it('Makes the expected API calls', async () => {
    await controller(req, res)

    expect(prisonerDetailsService.getPrisoner).toHaveBeenCalledWith('system_token', offenderNo)
    expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith('system_token', offenderNo)
    expect(locationService.searchGroups).toHaveBeenCalledWith('system_token', 'MDI')
  })

  it('Redirects when offender not in user caseloads', async () => {
    res.locals.user.allCaseloads = [{ caseLoadId: 'BWY' }]
    await controller(req, res)

    expect(res.render).toHaveBeenCalledWith('notFound.njk', { url: '/prisoner-search' })
  })

  it('Should render error template when there is an API error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getPrisoner.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrow(error)

    expect(res.locals.homeUrl).toBe(`http://localhost:3000/prisoner/${offenderNo}`)
  })

  describe('Header data', () => {
    it('populates the data correctly when no non-associations and no assessments', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          prisonerName: 'Test User',
          profileUrl: 'http://localhost:3000/prisoner/ABC123',
          searchForCellRootUrl: '/prisoner/ABC123/cell-move/search-for-cell',
          showNonAssociationsLink: false,
          alerts: [
            {
              alertCodes: ['HA'],
              classes: 'alert-status alert-status--self-harm',
              label: 'ACCT open',
            },
            {
              alertCodes: ['HA1'],
              classes: 'alert-status alert-status--self-harm',
              label: 'ACCT post closure',
            },
            {
              alertCodes: ['XGANG'],
              classes: 'alert-status alert-status--security',
              label: 'Gang member',
            },
            {
              alertCodes: ['VIP'],
              classes: 'alert-status alert-status--isolated-prisoner',
              label: 'Isolated',
            },
          ],
          offenderNo,
        }),
      )
    })

    it('shows the CSWAP description as the location', async () => {
      prisonerDetailsService.getPrisoner = jest.fn().mockResolvedValue({
        ...getDetailsResponse,
        cellLocation: 'CSWAP',
      })

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          prisonerDetails: {
            alerts: [
              {
                active: true,
                alertCode: 'XRF',
                alertType: 'X',
                expired: false,
              },
              {
                active: true,
                alertCode: 'XGANG',
                alertType: 'X',
                expired: false,
              },
              {
                active: true,
                alertCode: 'VIP',
                alertType: 'V',
                expired: false,
              },
              {
                active: true,
                alertCode: 'HA',
                alertType: 'H',
                expired: false,
              },
              {
                active: true,
                alertCode: 'HA1',
                alertType: 'H',
                expired: false,
              },
            ],
            assignedLivingUnit: {
              description: 'No cell allocated',
            },
            bookingId: 1234,
            cellLocation: 'CSWAP',
            csra: 'High',
            firstName: 'Test',
            lastName: 'User',
            prisonId: 'MDI',
            prisonerNumber: offenderNo,
          },
        }),
      )
    })

    it('shows the correct CSRA rating', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          convertedCsra: 'High',
        }),
      )
    })

    it('populates the data correctly when some non-associations in the same establishment', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        prisonId: 'MDI',
        nonAssociations: [
          {
            otherPrisonerDetails: {
              prisonId: 'MDI',
            },
          },
        ],
      })
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          numberOfNonAssociations: 1,
          showNonAssociationsLink: true,
        }),
      )
    })

    it('populates the dropdowns correctly', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          locations: [
            { text: 'All residential units', value: 'ALL' },
            { text: 'Casu', value: 'Casu' },
            { text: 'Houseblock 1', value: 'Houseblock 1' },
            { text: 'Houseblock 2', value: 'Houseblock 2' },
            { text: 'Houseblock 3', value: 'Houseblock 3' },
          ],
          cellAttributes: [
            { text: 'Single occupancy', value: 'SO' },
            { text: 'Multiple occupancy', value: 'MO' },
          ],
        }),
      )
    })

    describe('back link', () => {
      it('links back to the prisoner search page when there is no referrer', async () => {
        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/searchForCell.njk',
          expect.objectContaining({
            backUrl: '/prisoner-search',
          }),
        )
      })

      it('links back to the prisoner search page when referred back from select-cell', async () => {
        await controller(
          {
            ...req,
            session: {
              referrerUrl: 'http://dps/prisoner/G0637UO/cell-move/select-cell',
            },
          },
          res,
        )

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/searchForCell.njk',
          expect.objectContaining({
            backUrl: '/prisoner-search',
          }),
        )
      })

      it('links back to the prisoner search page when referred back from confirm-cell-move', async () => {
        await controller(
          {
            ...req,
            session: {
              referrerUrl: 'http://dps/prisoner/G0637UO/cell-move/confirm-cell-move',
            },
          },
          res,
        )

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/searchForCell.njk',
          expect.objectContaining({
            backUrl: '/prisoner-search',
          }),
        )
      })

      it('links back to the page the user came from in any other case', async () => {
        await controller(
          {
            ...req,
            session: {
              referrerUrl: '/dps/some/other/page',
            },
          },
          res,
        )

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/searchForCell.njk',
          expect.objectContaining({
            backUrl: '/dps/some/other/page',
          }),
        )
      })
    })
  })
})
