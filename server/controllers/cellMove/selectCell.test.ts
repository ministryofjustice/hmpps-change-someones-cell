import selectCellFactory from './selectCell'
import LocationService from '../../services/locationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { Alert } from '../../data/prisonApiClient'
import { LocationGroup } from '../../data/whereaboutsApiClient'
import { Prisoner } from '../../data/prisonerSearchApiClient'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'
import { CellLocation } from '../../data/locationsInsidePrisonApiClient'

jest.mock('../../services/locationService')
jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

const someOffenderNumber = 'A12345'
const someBookingId = -10
const someAgency = 'LEI'

describe('Select a cell', () => {
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))

  let controller
  let req
  let res

  const offender: Prisoner = {
    bookingId: 1,
    prisonerNumber: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    prisonId: 'MDI',
    prisonName: 'Moorlands',
    gender: 'Male',
    cellLocation: 'UNIT-1',
    category: 'C',
    csra: 'High',
    alerts: [
      { alertType: 'TEST', alertCode: 'PEEP', active: true, expired: false },
      { alertType: 'TEST', alertCode: 'DCC', active: true, expired: false },
      { alertType: 'TEST', alertCode: 'HA', active: true, expired: false },
      { alertType: 'TEST', alertCode: 'HA1', active: true, expired: false },
    ],
  }

  const alert: Alert = {
    active: true,
    addedByFirstName: 'John',
    addedByLastName: 'Smith',
    alertCode: 'XGANG',
    alertCodeDescription: 'Gang member',
    alertId: 1,
    alertType: 'X',
    alertTypeDescription: 'Security',
    bookingId: 14,
    comment: 'silly',
    dateCreated: '2019-08-25',
    dateExpires: '2019-09-20',
    expired: false,
    expiredByFirstName: 'Jane',
    expiredByLastName: 'Smith',
    modifiedDateTime: '2021-07-05T10:35:17',
    offenderNo: 'G3878UK',
  }

  const systemClientToken = 'system_token'

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 1594900800000) // Thursday, 16 July 2020 12:00:00
  })

  afterAll(() => {
    const spy = jest.spyOn(Date, 'now')
    spy.mockRestore()
  })

  beforeEach(() => {
    prisonerDetailsService.getPrisoner = jest.fn().mockImplementation((_, prisonerNumber) =>
      Promise.resolve({
        firstName: 'John',
        lastName: 'Doe',
        prisonerNumber,
        bookingId: someBookingId,
        prisonId: someAgency,
        prisonName: 'ye olde prisone',
        csra: 'High',
        alerts: [
          { ...alert, expired: false, alertCode: 'PEEP' },
          { ...alert, expired: true, alertCode: 'DCC' },
          { ...alert, expired: false, alertCode: 'HA' },
          { ...alert, expired: false, alertCode: 'HA1' },
        ],
        dateOfBirth: '1990-10-12',
        cellLocation: '1-1-001',
        category: 'C',
      }),
    )

    const locationGroups: LocationGroup[] = [
      {
        name: 'Houseblock 1',
        key: 'hb1',
        children: [{ name: 'Sub value', key: 'sl', children: [] }],
      },
    ]

    prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([])

    locationService.searchGroups = jest.fn().mockResolvedValue(locationGroups)

    controller = selectCellFactory({
      locationService,
      nonAssociationsService,
      prisonerCellAllocationService,
      prisonerDetailsService,
    })

    req = {
      params: {
        offenderNo: someOffenderNumber,
      },
      query: {},
      session: {
        userDetails: {
          activeCaseLoadId: 'LEI',
        },
      },
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
    }
  })

  describe('Default page state', () => {
    it('should make the correct api calls to display default data', async () => {
      await controller(req, res)

      expect(prisonerDetailsService.getPrisoner).toHaveBeenCalledWith(systemClientToken, someOffenderNumber)
      expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, someOffenderNumber)
      expect(locationService.searchGroups).toHaveBeenCalledWith(systemClientToken, someAgency)
    })

    it('Redirects when offender not in user caseloads', async () => {
      res.locals.user.allCaseloads = [{ caseLoadId: 'BWY' }]
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith('notFound.njk', { url: '/prisoner-search' })
    })

    it('should call get cells with capacity for leeds', async () => {
      await controller(req, res)

      expect(prisonerCellAllocationService.getCellsWithCapacity).toHaveBeenCalledWith(
        systemClientToken,
        someAgency,
        'ALL',
        undefined,
      )
    })

    it('should call get cells with capacity for leeds and house block 1', async () => {
      req.query = { location: 'hb1' }

      await controller(req, res)

      expect(prisonerCellAllocationService.getCellsWithCapacity).toHaveBeenCalledWith(
        systemClientToken,
        someAgency,
        'hb1',
        undefined,
      )
    })

    it('should populate view model with active cell move specific alerts', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          alerts: [
            { alertCodes: ['HA'], classes: 'alert-status alert-status--self-harm', label: 'ACCT open' },
            {
              alertCodes: ['HA1'],
              classes: 'alert-status alert-status--self-harm',
              label: 'ACCT post closure',
            },
            {
              alertCodes: ['PEEP'],
              classes: 'alert-status alert-status--medical',
              label: 'PEEP',
            },
          ],
        }),
      )
    })

    it('should populate view model with form values', async () => {
      req.query = { cellType: 'SO' }
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          formValues: { cellType: 'SO', location: 'ALL', subLocation: undefined },
        }),
      )
    })

    it('should populate view model with urls', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          backUrl: '/prisoner/A12345/cell-move/search-for-cell',
          csraDetailsUrl: '/prisoner/A12345/cell-move/cell-sharing-risk-assessment-details',
          formAction: '/prisoner/A12345/cell-move/select-cell',
          nonAssociationLink: '/prisoner/A12345/cell-move/non-associations',
          offenderDetailsUrl: '/prisoner/A12345/cell-move/prisoner-details',
          searchForCellRootUrl: '/prisoner/A12345/cell-move/search-for-cell',
          selectCellRootUrl: '/prisoner/A12345/cell-move/select-cell',
          showNonAssociationsLink: false,
        }),
      )
    })

    it('should populate view model with breadcrumbs offender details', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          breadcrumbPrisonerName: 'Doe, John',
          prisonerName: 'John Doe',
          offenderNo: 'A12345',
          prisonerDetails: expect.objectContaining({
            alerts: [
              expect.objectContaining({ alertCode: 'PEEP', expired: false }),
              expect.objectContaining({ alertCode: 'DCC', expired: true }),
              expect.objectContaining({ alertCode: 'HA', expired: false }),
              expect.objectContaining({ alertCode: 'HA1', expired: false }),
            ],
            bookingId: -10,
            firstName: 'John',
            lastName: 'Doe',
            prisonerNumber: 'A12345',
            prisonId: 'LEI',
            cellLocation: '1-1-001',
            prisonName: 'ye olde prisone',
          }),
        }),
      )
    })

    it('should populate view model with locations', async () => {
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          locations: [
            { text: 'All residential units', value: 'ALL' },
            { text: 'Houseblock 1', value: 'hb1' },
          ],
        }),
      )
    })

    it('should populate view model with sub locations', async () => {
      req.query = { location: 'hb1' }
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          subLocations: [
            { text: 'Select area in residential unit', value: '' },
            { text: 'Sub value', value: 'sl' },
          ],
        }),
      )
    })

    it('should render subLocations template on ajax request', async () => {
      req.xhr = true
      req.query = { locationId: 'hb1' }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/partials/subLocationsSelect.njk',
        expect.objectContaining({
          subLocations: [
            { text: 'Select area in residential unit', value: '' },
            { text: 'Sub value', value: 'sl' },
          ],
        }),
      )
    })

    it('should render subLocations template on ajax request when the subLocationId is ALL', async () => {
      req.xhr = true
      req.query = { locationId: 'ALL' }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/partials/subLocationsSelect.njk',
        expect.objectContaining({
          subLocations: [{ text: 'No areas to select', value: '' }],
        }),
      )
    })

    it('should make a call to retrieve sub locations', async () => {
      req.query = {
        location: 'hb1',
        subLocation: 'sub1',
        cellType: 'SO',
      }
      await controller(req, res)

      expect(prisonerCellAllocationService.getCellsWithCapacity).toHaveBeenCalledWith(
        systemClientToken,
        someAgency,
        'hb1',
        'sub1',
      )
    })

    it('should not make a call to retrieve prisoners to get single capacity cells if there are only multi capacity cells at that location', async () => {
      req.query = {
        location: 'hb1',
        subLocation: 'sub1',
        cellType: 'SO',
      }
      prisonerCellAllocationService.getCellsWithCapacity.mockResolvedValue([
        {
          id: 'aaaa-bbbb-cccc-dddd',
          key: 'MDI-1',
          pathHierarchy: '1',
          noOfOccupants: 0,
          maxCapacity: 2,
          prisonId: 'MDI',
          workingCapacity: 1,
          legacyAttributes: [
            {
              typeCode: 'LC',
              typeDescription: 'Listener Cell',
            },
          ],
          specialistCellTypes: [
            {
              typeCode: 'CAT_A',
              typeDescription: 'Category A Cell',
            },
          ],
        },
      ])
      await controller(req, res)
    })

    it('should not make a call to retrieve prisoners to get multi capacity cells if there are only single capacity cells at that location', async () => {
      req.query = {
        location: 'hb1',
        subLocation: 'sub1',
        cellType: 'MO',
      }
      prisonerCellAllocationService.getCellsWithCapacity.mockResolvedValue([
        {
          id: 'aaaa-bbbb-cccc-dddd',
          key: 'MDI-1',
          pathHierarchy: '1',
          noOfOccupants: 0,
          maxCapacity: 2,
          prisonId: 'MDI',
          workingCapacity: 1,
          legacyAttributes: [
            {
              typeCode: 'LC',
              typeDescription: 'Listener Cell',
            },
          ],
          specialistCellTypes: [
            {
              typeCode: 'CAT_A',
              typeDescription: 'Category A Cell',
            },
          ],
        },
      ])
      await controller(req, res)
    })

    it('should make a call to retrieve prisoners at location', async () => {
      req.query = {
        location: 'hb1',
        subLocation: 'sub1',
        cellType: 'MO',
      }
      prisonerCellAllocationService.getCellsWithCapacity.mockResolvedValue([
        {
          id: 'aaaa-bbbb-cccc-dddd',
          key: 'MDI-1',
          pathHierarchy: '1',
          noOfOccupants: 0,
          maxCapacity: 2,
          prisonId: 'MDI',
          workingCapacity: 1,
          legacyAttributes: [
            {
              typeCode: 'LC',
              typeDescription: 'Listener Cell',
            },
          ],
          specialistCellTypes: [
            {
              typeCode: 'CAT_A',
              typeDescription: 'Category A Cell',
            },
          ],
        },
      ])
      await controller(req, res)
    })
  })

  describe('Cell types', () => {
    beforeEach(() => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 'aaaa',
          key: 'MDI-1-1',
          maxCapacity: 1,
          noOfOccupants: 0,
          legacyAttributes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
          specialistCellTypes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
        },
        {
          id: 'bbbb',
          key: 'MDI-1-2',
          maxCapacity: 2,
          noOfOccupants: 0,
          legacyAttributes: [
            { typeDescription: 'Special Cell', typeCode: 'SPC' },
            { typeDescription: 'Gated Cell', typeCode: 'GC' },
          ],
          specialistCellTypes: [
            { typeDescription: 'Special Cell', typeCode: 'SPC' },
            { typeDescription: 'Gated Cell', typeCode: 'GC' },
          ],
        },
      ])
    })

    describe('when Single occupancy cell type is selected', () => {
      it('should only show cells with a capacity of 1', async () => {
        req.query = { cellType: 'SO' }

        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/selectCell.njk',
          expect.objectContaining({
            cells: [
              {
                key: 'MDI-1-1',
                type: [
                  {
                    typeCode: 'SO',
                    typeDescription: 'Single occupancy',
                  },
                  {
                    typeCode: 'LC',
                    typeDescription: 'Listener Cell',
                  },
                ],
                maxCapacity: 1,
                occupants: [],
                spaces: 1,
              },
            ],
          }),
        )
      })
    })

    describe('when Multiple occupancy cell type is selected', () => {
      it('should only show cells with a capacity of 2 or more', async () => {
        req.query = { cellType: 'MO' }

        await controller(req, res)

        expect(res.render).toHaveBeenCalledWith(
          'cellMove/selectCell.njk',
          expect.objectContaining({
            cells: [
              {
                key: 'MDI-1-2',
                maxCapacity: 2,
                occupants: [],
                spaces: 2,
                type: [
                  { typeCode: 'SPC', typeDescription: 'Special Cell' },
                  { typeCode: 'GC', typeDescription: 'Gated Cell' },
                ],
              },
            ],
          }),
        )
      })
    })
  })

  describe('Cell view model data', () => {
    beforeEach(() => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 'ffff',
          key: 'LEI-1-1-3',
          pathHierarchy: '1-1-3',
          prisonId: 'MDI',
          workingCapacity: 4,
          maxCapacity: 4,
          noOfOccupants: 1,
          legacyAttributes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
          specialistCellTypes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
        },
        {
          id: 'gggg',
          key: 'LEI-1-1-2',
          pathHierarchy: '1-1-2',
          maxCapacity: 5,
          noOfOccupants: 1,
          prisonId: 'MDI',
          workingCapacity: 5,
          legacyAttributes: [
            { typeDescription: 'Special Cell', typeCode: 'SPC' },
            { typeDescription: 'Gated Cell', typeCode: 'GC' },
          ],
          specialistCellTypes: [
            { typeDescription: 'Special Cell', typeCode: 'SPC' },
            { typeDescription: 'Gated Cell', typeCode: 'GC' },
          ],
        },
        {
          id: 'kkkk',
          key: 'LEI-1-1-1',
          maxCapacity: 3,
          noOfOccupants: 1,
          prisonId: 'MDI',
          pathHierarchy: '1-1-1',
          workingCapacity: 3,
          legacyAttributes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
          specialistCellTypes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
        },
      ] as CellLocation[])
    })

    it('should make the relevant calls to gather cell occupant data', async () => {
      await controller(req, res)
    })

    it('should return the correctly formatted cell details', async () => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue(
        Promise.resolve([
          {
            key: 'MDI-1-1-3',
            pathHierarchy: '1-1-3',
            prisonId: 'MDI',
            noOfOccupants: 1,
            maxCapacity: 2,
            legacyAttributes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            specialistCellTypes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            prisonersInCell: [
              {
                ...offender,
                firstName: 'bob1',
                lastName: 'doe1',
                prisonId: 'MDI',
                prisonerNumber: 'A111111',
                cellLocation: '1-1-3',
                csra: 'Standard',
              },
            ],
          },
          {
            key: 'MDI-1-1-2',
            pathHierarchy: '1-1-2',
            prisonId: 'MDI',
            noOfOccupants: 1,
            maxCapacity: 2,
            legacyAttributes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            specialistCellTypes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            prisonersInCell: [
              {
                ...offender,
                firstName: 'bob2',
                lastName: 'doe2',
                prisonerNumber: 'A222222',
                cellLocation: '1-1-2',
                csra: 'High',
                prisonId: 'MDI',
              },
            ],
          },
          {
            key: 'MDI-1-1-1',
            pathHierarchy: '1-1-1',
            prisonId: 'MDI',
            noOfOccupants: 1,
            maxCapacity: 2,
            legacyAttributes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            specialistCellTypes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
            prisonersInCell: [
              {
                ...offender,
                firstName: 'bob3',
                lastName: 'doe3',
                prisonerNumber: 'A333333',
                cellLocation: '1-1-1',
                csra: 'High',
                prisonId: 'MDI',
              },
            ],
          },
        ] as CellLocation[]),
      )

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          cells: [
            {
              key: 'MDI-1-1-3',
              maxCapacity: 2,
              occupants: [
                {
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
                      alertCodes: ['PEEP'],
                      classes: 'alert-status alert-status--medical',
                      label: 'PEEP',
                    },
                  ],
                  cellId: '1-1-3',
                  csra: 'Standard',
                  csraDetailsUrl: '/prisoner/A111111/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe1, Bob1',
                  nonAssociation: false,
                  viewOffenderDetails: '/prisoner/A111111/cell-move/prisoner-details',
                },
              ],
              spaces: 1,
              type: [
                {
                  typeCode: 'WA',
                  typeDescription: 'Wheelchair Access',
                },
              ],
            },
            {
              key: 'MDI-1-1-2',
              maxCapacity: 2,
              occupants: [
                {
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
                      alertCodes: ['PEEP'],
                      classes: 'alert-status alert-status--medical',
                      label: 'PEEP',
                    },
                  ],
                  cellId: '1-1-2',
                  csra: 'High',
                  csraDetailsUrl: '/prisoner/A222222/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe2, Bob2',
                  nonAssociation: false,
                  viewOffenderDetails: '/prisoner/A222222/cell-move/prisoner-details',
                },
              ],
              spaces: 1,
              type: [
                {
                  typeCode: 'WA',
                  typeDescription: 'Wheelchair Access',
                },
              ],
            },
            {
              key: 'MDI-1-1-1',
              maxCapacity: 2,
              occupants: [
                {
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
                      alertCodes: ['PEEP'],
                      classes: 'alert-status alert-status--medical',
                      label: 'PEEP',
                    },
                  ],
                  cellId: '1-1-1',
                  csra: 'High',
                  csraDetailsUrl: '/prisoner/A333333/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe3, Bob3',
                  nonAssociation: false,
                  viewOffenderDetails: '/prisoner/A333333/cell-move/prisoner-details',
                },
              ],
              spaces: 1,
              type: [
                {
                  typeCode: 'WA',
                  typeDescription: 'Wheelchair Access',
                },
              ],
            },
          ],
        }),
      )
    })
  })

  describe('Non associations', () => {
    beforeEach(() => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        prisonerNumber: offender.prisonerNumber,
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        prisonId: offender.prisonId,
        prisonName: 'MOORLAND (HMP & YOI)',
        cellLocation: offender.cellLocation,
        openCount: 1,
        closedCount: 0,
        nonAssociations: [
          {
            id: 1,
            role: 'VIC',
            roleDescription: 'Victim',
            reason: 'GANG',
            reasonDescription: 'Gangs',
            restrictionType: 'LAND',
            restrictionTypeDescription: 'Do Not Locate on Same Landing',
            whenCreated: 'string',
            whenUpdated: 'string',
            updatedBy: 'string',
            comment: 'Gang violence',
            otherPrisonerDetails: {
              prisonerNumber: 'A111111',
              firstName: 'bob1',
              lastName: 'doe1',
              role: 'RIV',
              roleDescription: 'Rival Gang',
              prisonId: 'MDI',
              prisonName: 'MOORLAND (HMP & YOI)',
              cellLocation: '1-3-026',
            },
          },
        ],
      })

      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 'aaaa',
          key: 'LEI-1-1-1',
          maxCapacity: 4,
          noOfOccupants: 1,
          pathHierarchy: '1-1-1',
          legacyAttributes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
          specialistCellTypes: [{ typeDescription: 'Wheelchair Access', typeCode: 'WA' }],
          prisonersInCell: [
            {
              ...offender,
              firstName: 'bob1',
              lastName: 'doe1',
              prisonerNumber: 'A111111',
              cellLocation: '1-1-1',
              alerts: [],
            },
          ],
        },
      ])

      req.query = {
        location: 'Houseblock 1',
      }
    })

    it('should render the template with the correct number of non associations', async () => {
      req.query = { location: 'ALL' }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          numberOfNonAssociations: 1,
          showNonAssociationsLink: true,
        }),
      )
    })

    it('should mark an occupant with the no association badge', async () => {
      req.query = { location: 'ALL' }

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          cells: [
            {
              key: 'LEI-1-1-1',
              maxCapacity: 4,
              occupants: [
                {
                  alerts: [],
                  cellId: '1-1-1',
                  csra: 'High',
                  csraDetailsUrl: '/prisoner/A111111/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe1, Bob1',
                  nonAssociation: true,
                  viewOffenderDetails: '/prisoner/A111111/cell-move/prisoner-details',
                },
              ],
              spaces: 3,
              type: [
                {
                  typeCode: 'WA',
                  typeDescription: 'Wheelchair Access',
                },
              ],
            },
          ],
        }),
      )
    })

    it('should set show non association value to true when there are res unit level non-associations', async () => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 'aaaa',
          key: 'MDI-1-3',
          maxCapacity: 4,
          noOfOccupants: 1,
          prisonId: 'MDI',
          workingCapacity: 4,
          pathHierarchy: '1-3',
          specialistCellTypes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
          legacyAttributes: [
            { typeDescription: 'Single occupancy', typeCode: 'SO' },
            { typeDescription: 'Listener Cell', typeCode: 'LC' },
          ],
        },
      ] as CellLocation[])

      req.query = { location: 'Houseblock 1' }
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          showNonAssociationWarning: true,
        }),
      )
    })

    it('should set show non association value to true when there are non-associations within the establishment', async () => {
      res.locals.user.allCaseloads = [{ caseLoadId: 'MDI' }]
      prisonerDetailsService.getPrisoner = jest.fn().mockImplementation((_, offenderNo) =>
        Promise.resolve({
          firstName: 'John',
          lastName: 'Doe',
          prisonerNumber: offenderNo,
          bookingId: someBookingId,
          prisonId: 'MDI',
          csra: 'High',
          gender: 'Male',
          alerts: [
            { ...alert, expired: false, alertCode: 'PEEP' },
            { ...alert, expired: true, alertCode: 'DCC' },
            { ...alert, expired: false, alertCode: 'HA' },
            { ...alert, expired: false, alertCode: 'HA1' },
          ],
          cellLocation: '1-2-012',
          prisonName: 'ye olde prisone',
          category: 'C',
        } as Prisoner),
      )

      req.query = {}

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          showNonAssociationWarning: true,
        }),
      )
    })

    it('should set show non association value to false', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        prisonerNumber: 'G6123VU',
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        prisonName: 'MOORLAND (HMP & YOI)',
        cellLocation: '1-1-015',
        nonAssociations: [
          {
            role: 'VIC',
            roleDescription: 'Victim',
            reason: 'GANG',
            reasonDescription: 'Gangs',
            restrictionType: 'LAND',
            restrictionTypeDescription: 'Do Not Locate on Same Landing',
            whenCreated: 'string',
            whenUpdated: 'string',
            updatedBy: 'string',
            comment: 'Gang violence',
            otherPrisonerDetails: {
              prisonerNumber: 'A111111',
              firstName: 'bob1',
              lastName: 'doe1',
              role: 'PER',
              roleDescription: 'Perp',
              cellLocation: '2-1-026',
            },
          },
        ],
      } as PrisonerNonAssociation)

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          showNonAssociationWarning: false,
        }),
      )
    })
  })

  describe('Current location is not a cell', () => {
    it('shows the CSWAP description as the location', async () => {
      res.locals.user.allCaseloads = [{ caseLoadId: 'MDI' }]
      prisonerDetailsService.getPrisoner = jest.fn().mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        prisonerNumber: someOffenderNumber,
        bookingId: someBookingId,
        prisonId: 'MDI',
        alerts: [],
        cellLocation: 'CSWAP',
      })
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        prisonerNumber: someOffenderNumber,
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        prisonName: 'MOORLAND (HMP & YOI)',
        cellLocation: '1-1-015',
        prisonId: 'MDI',
        nonAssociations: [],
      })

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          prisonerDetails: {
            prisonId: 'MDI',
            alerts: [],
            bookingId: -10,
            firstName: 'John',
            lastName: 'Doe',
            prisonerNumber: 'A12345',
            cellLocation: 'CSWAP',
            assignedLivingUnit: {
              description: 'No cell allocated',
            },
          },
        }),
      )
    })
  })
})
