import moment from 'moment'
import searchForCell from './searchForCell'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import LocationService from '../../services/locationService'
import NonAssociationsService from '../../services/nonAssociationsService'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

describe('select location', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'

  const getDetailsResponse = {
    bookingId: 1234,
    offenderNo,
    firstName: 'Test',
    lastName: 'User',
    csra: 'High',
    csraClassificationCode: 'HI',
    agencyId: 'MDI',
    assessments: [],
    assignedLivingUnit: {},
    alerts: [
      {
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        alertCode: 'XC',
        alertCodeDescription: 'Risk to females',
        alertId: 1,
        alertType: 'X',
        alertTypeDescription: 'Security',
        bookingId: 14,
        comment: 'has a large poster on cell wall',
        dateCreated: '2019-08-20',
        dateExpires: null,
        expired: false,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
        offenderNo,
      },
      {
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        alertCode: 'XGANG',
        alertCodeDescription: 'Gang member',
        alertId: 1,
        alertType: 'X',
        alertTypeDescription: 'Security',
        bookingId: 14,
        comment: 'has a large poster on cell wall',
        dateCreated: '2019-08-20',
        dateExpires: null,
        expired: false,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
        offenderNo,
      },
      {
        alertId: 3,
        alertType: 'V',
        alertTypeDescription: 'Vulnerability',
        alertCode: 'VIP',
        alertCodeDescription: 'Isolated Prisoner',
        comment: 'test',
        dateCreated: '2020-08-20',
        expired: false,
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
      },
      {
        alertId: 4,
        alertType: 'H',
        alertTypeDescription: 'Self Harm',
        alertCode: 'HA',
        alertCodeDescription: 'ACCT open',
        comment: 'Test comment',
        dateCreated: '2021-02-18',
        expired: false,
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
      },
      {
        alertId: 5,
        alertType: 'H',
        alertTypeDescription: 'Self Harm',
        alertCode: 'HA1',
        alertCodeDescription: 'ACCT post closure',
        comment: '',
        dateCreated: '2021-02-19',
        expired: false,
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
      },
    ],
  }

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

    prisonerDetailsService.getDetails = jest.fn().mockImplementation((_, requestedOffenderNo) => ({
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

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith('system_token', offenderNo, true)
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
    prisonerDetailsService.getDetails.mockImplementation(() => Promise.reject(error))

    await expect(controller(req, res)).rejects.toThrow(error)

    expect(res.locals.homeUrl).toBe(`http://localhost:3000/prisoner/${offenderNo}`)
  })

  describe('Header data', () => {
    it('populates the data correctly when no non-associations and no assessments', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          prisonerDetails: getDetailsResponse,
          breadcrumbPrisonerName: 'User, Test',
          prisonerName: 'Test User',
          numberOfNonAssociations: 0,
          showNonAssociationsLink: false,
          alerts: [
            { alertCodes: ['HA'], classes: 'alert-status alert-status--acct', label: 'ACCT open' },
            {
              alertCodes: ['HA1'],
              classes: 'alert-status alert-status--acct-post-closure',
              label: 'ACCT post closure',
            },
            { alertCodes: ['XGANG'], classes: 'alert-status alert-status--gang-member', label: 'Gang member' },
            { alertCodes: ['VIP'], classes: 'alert-status alert-status--isolated-prisoner', label: 'Isolated' },
          ],
          offenderNo,
        }),
      )
    })

    it('shows the CSWAP description as the location', async () => {
      prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
        ...getDetailsResponse,
        assignedLivingUnit: {
          ...getDetailsResponse.assignedLivingUnit,
          description: 'CSWAP',
        },
      })

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          prisonerDetails: {
            ...getDetailsResponse,
            assignedLivingUnit: {
              ...getDetailsResponse.assignedLivingUnit,
              description: 'No cell allocated',
            },
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

    it('populates the data correctly when some non-associations, but not in the same establishment', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        agencyDescription: 'MOORLAND',
        nonAssociations: [
          {
            offenderNonAssociation: {
              agencyDescription: 'LEEDS',
            },
          },
        ],
      })
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          numberOfNonAssociations: 0,
          showNonAssociationsLink: false,
        }),
      )
    })

    it('populates the data correctly when some non-associations, but not effective yet', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        agencyDescription: 'MOORLAND',
        nonAssociations: [
          {
            effectiveDate: moment().add(1, 'days'),
            offenderNonAssociation: {
              agencyDescription: 'MOORLAND',
            },
          },
        ],
      })
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          numberOfNonAssociations: 0,
          showNonAssociationsLink: false,
        }),
      )
    })

    it('populates the data correctly when some non-associations, but expired', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        agencyDescription: 'MOORLAND',
        nonAssociations: [
          {
            effectiveDate: moment().subtract(10, 'days'),
            expiryDate: moment().subtract(1, 'days'),
            offenderNonAssociation: {
              agencyDescription: 'MOORLAND',
            },
          },
        ],
      })
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/searchForCell.njk',
        expect.objectContaining({
          numberOfNonAssociations: 0,
          showNonAssociationsLink: false,
        }),
      )
    })

    it('populates the data correctly when some non-associations in the same establishment', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        agencyDescription: 'MOORLAND',
        nonAssociations: [
          {
            effectiveDate: moment(),
            offenderNonAssociation: {
              agencyDescription: 'MOORLAND',
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
            headers: {
              referer: 'http://dps/prisoner/G0637UO/cell-move/select-cell',
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
            headers: {
              referer: 'http://dps/prisoner/G0637UO/cell-move/confirm-cell-move',
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
            headers: {
              referer: '/dps/some/other/page',
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
