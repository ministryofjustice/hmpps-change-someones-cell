import selectCellFactory from './selectCell'
import LocationService from '../../services/locationService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { Alert, Location, Offender } from '../../data/prisonApiClient'
import { LocationGroup } from '../../data/whereaboutsApiClient'

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
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let controller
  let req
  let res

  const location: Location = {
    locationId: 0,
    locationType: 'string',
    description: 'string',
    locationUsage: 'string',
    agencyId: 'string',
    parentLocationId: 0,
    currentOccupancy: 0,
    locationPrefix: 'string',
    operationalCapacity: 0,
    userDescription: 'string',
    internalLocationCode: 'string',
    subLocations: true,
  }

  const cellLocationData = {
    ...location,
    parentLocationId: 2,
  }

  const parentLocationData = {
    ...location,
    parentLocationId: 3,
  }

  const superParentLocationData = {
    ...location,
    locationPrefix: 'MDI-1',
  }

  const offender: Offender = {
    bookingId: 1,
    offenderNo: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    dateOfBirth: '1990-10-12',
    age: 29,
    agencyId: 'MDI',
    assignedLivingUnitId: 1,
    assignedLivingUnitDesc: 'UNIT-1',
    categoryCode: 'C',
    alertsDetails: ['PEEP', 'DCC', 'HA', 'HA1'],
    alertsCodes: ['PEEP', 'DCC', 'HA', 'HA1'],
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

  const assessment = {
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

  const systemClientToken = 'system_token'

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 1594900800000) // Thursday, 16 July 2020 12:00:00
  })

  afterAll(() => {
    const spy = jest.spyOn(Date, 'now')
    spy.mockRestore()
  })

  beforeEach(() => {
    prisonerDetailsService.getDetails = jest.fn().mockImplementation((_, offenderNo) =>
      Promise.resolve({
        firstName: 'John',
        lastName: 'Doe',
        offenderNo,
        bookingId: someBookingId,
        agencyId: someAgency,
        assignedLivingUnit: {
          agencyId: someAgency,
          locationId: 12345,
          description: '1-2-012',
          agencyName: 'ye olde prisone',
        },
        csraClassificationCode: 'HI',
        alerts: [
          { ...alert, expired: false, alertCode: 'PEEP' },
          { ...alert, expired: true, alertCode: 'DCC' },
          { ...alert, expired: false, alertCode: 'HA' },
          { ...alert, expired: false, alertCode: 'HA1' },
        ],
        dateOfBirth: '1990-10-12',
        age: 29,
        assignedLivingUnitId: 5432,
        assignedLivingUnitDesc: '1-1-001',
        categoryCode: 'C',
        alertsDetails: ['PEEP', 'DCC', 'HA', 'HA1'],
        alertsCodes: ['PEEP', 'DCC', 'HA', 'HA1'],
      }),
    )

    const locationGroups: LocationGroup[] = [
      {
        name: 'Houseblock 1',
        key: 'hb1',
        children: [{ name: 'Sub value', key: 'sl' }],
      },
    ]

    locationService.getLocation = jest.fn().mockResolvedValue(Promise.resolve(location))
    prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([])
    prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([])

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

      expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, someOffenderNumber, true)
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
            age: 29,
            agencyId: 'LEI',
            alerts: [
              expect.objectContaining({ alertCode: 'PEEP', expired: false }),
              expect.objectContaining({ alertCode: 'DCC', expired: true }),
              expect.objectContaining({ alertCode: 'HA', expired: false }),
              expect.objectContaining({ alertCode: 'HA1', expired: false }),
            ],
            bookingId: -10,
            firstName: 'John',
            lastName: 'Doe',
            offenderNo: 'A12345',
            assignedLivingUnit: {
              agencyId: someAgency,
              locationId: 12345,
              description: '1-2-012',
              agencyName: 'ye olde prisone',
            },
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
  })

  describe('Cell types', () => {
    beforeEach(() => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-1',
          capacity: 1,
          noOfOccupants: 0,
          attributes: [
            { description: 'Single occupancy', code: 'SO' },
            { description: 'Listener Cell', code: 'LC' },
          ],
        },
        {
          id: 2,
          description: 'MDI-1-2',
          capacity: 2,
          noOfOccupants: 0,
          attributes: [
            { description: 'Special Cell', code: 'SPC' },
            { description: 'Gated Cell', code: 'GC' },
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
                attributes: [
                  { code: 'LC', description: 'Listener Cell' },
                  { code: 'SO', description: 'Single occupancy' },
                ],
                capacity: 1,
                description: 'MDI-1-1',
                id: 1,
                noOfOccupants: 0,
                occupants: [],
                spaces: 1,
                type: [
                  { code: 'LC', description: 'Listener Cell' },
                  { code: 'SO', description: 'Single occupancy' },
                ],
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
                attributes: [
                  { code: 'GC', description: 'Gated Cell' },
                  { code: 'SPC', description: 'Special Cell' },
                ],
                capacity: 2,
                description: 'MDI-1-2',
                id: 2,
                noOfOccupants: 0,
                occupants: [],
                spaces: 2,
                type: [
                  { code: 'GC', description: 'Gated Cell' },
                  { code: 'SPC', description: 'Special Cell' },
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
      locationService.getLocation
        .mockResolvedValueOnce(cellLocationData)
        .mockResolvedValueOnce(parentLocationData)
        .mockResolvedValueOnce(superParentLocationData)
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([
        { firstName: 'bob', lastName: 'doe', offenderNo: 'A11111' },
        { firstName: 'dave', lastName: 'doe1', offenderNo: 'A22222' },
      ])

      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-3',
          capacity: 4,
          noOfOccupants: 1,
          attributes: [
            { description: 'Single occupancy', code: 'SO' },
            { description: 'Listener Cell', code: 'LC' },
          ],
        },
        {
          id: 2,
          description: 'MDI-1-2',
          capacity: 5,
          noOfOccupants: 1,
          attributes: [
            { description: 'Special Cell', code: 'SPC' },
            { description: 'Gated Cell', code: 'GC' },
          ],
        },
        {
          id: 3,
          description: 'MDI-1-1',
          capacity: 3,
          noOfOccupants: 1,
          attributes: [{ description: 'Wheelchair Access', code: 'WA' }],
        },
      ])
    })

    it('should make the relevant calls to gather cell occupant data', async () => {
      await controller(req, res)

      expect(prisonerCellAllocationService.getInmatesAtLocation).toHaveBeenCalledWith(systemClientToken, 1)
      expect(prisonerCellAllocationService.getInmatesAtLocation).toHaveBeenCalledWith(systemClientToken, 2)
      expect(prisonerCellAllocationService.getInmatesAtLocation).toHaveBeenCalledWith(systemClientToken, 3)
      expect(prisonerDetailsService.getAlerts).toHaveBeenCalledWith(systemClientToken, 'LEI', ['A11111', 'A22222'])
    })

    it('should return the correctly formatted cell details', async () => {
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockImplementation((token, cellId) => {
        if (cellId === 1)
          return Promise.resolve([
            {
              ...offender,
              firstName: 'bob1',
              lastName: 'doe1',
              offenderNo: 'A111111',
              assignedLivingUnitId: cellId,
            },
          ])
        if (cellId === 2)
          return Promise.resolve([
            {
              ...offender,
              firstName: 'bob2',
              lastName: 'doe2',
              offenderNo: 'A222222',
              assignedLivingUnitId: cellId,
            },
          ])

        return Promise.resolve([
          {
            ...offender,
            firstName: 'bob3',
            lastName: 'doe3',
            offenderNo: 'A333333',
            assignedLivingUnitId: cellId,
          },
        ])
      })

      prisonerDetailsService.getAlerts = jest.fn().mockResolvedValue([
        { ...alert, offenderNo: 'A111111', alertCode: 'PEEP' },
        { ...alert, offenderNo: 'A222222', alertCode: 'XEL' },
        { ...alert, offenderNo: 'A333333', alertCode: 'URS' },
      ])

      prisonerDetailsService.getCsraAssessments = jest.fn().mockResolvedValue([
        {
          ...assessment,
          offenderNo: 'A111111',
          assessmentDescription: 'TEST',
          assessmentCode: 'TEST',
          assessmentComment: 'test',
        },
        {
          ...assessment,
          offenderNo: 'A222222',
          assessmentDescription: 'CSR',
          assessmentCode: 'CSR',
          assessmentComment: 'test',
          classification: 'High',
          classificationCode: 'HI',
        },
        {
          ...assessment,
          offenderNo: 'A333333',
          assessmentDescription: 'CSR',
          assessmentCode: 'CSR',
          assessmentComment: 'test',
          classification: 'Standard',
          classificationCode: 'STANDARD',
        },
      ])

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          cells: [
            {
              attributes: [{ code: 'WA', description: 'Wheelchair Access' }],
              capacity: 3,
              description: 'MDI-1-1',
              id: 3,
              noOfOccupants: 1,
              occupants: [
                {
                  alerts: [
                    {
                      alertCodes: ['URS'],
                      classes: 'alert-status alert-status--refusing-to-shield',
                      label: 'Refusing to shield',
                    },
                  ],
                  nonAssociation: false,
                  cellId: 3,
                  csra: 'Standard',
                  csraDetailsUrl: '/prisoner/A333333/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe3, Bob3',
                  viewOffenderDetails: '/prisoner/A333333/cell-move/prisoner-details',
                },
              ],
              spaces: 2,
              type: [{ code: 'WA', description: 'Wheelchair Access' }],
            },
            {
              attributes: [
                { code: 'GC', description: 'Gated Cell' },
                {
                  code: 'SPC',
                  description: 'Special Cell',
                },
              ],
              capacity: 5,
              description: 'MDI-1-2',
              id: 2,
              noOfOccupants: 1,
              occupants: [
                {
                  alerts: [
                    {
                      alertCodes: ['XEL'],
                      classes: 'alert-status alert-status--elist',
                      label: 'E-list',
                    },
                  ],
                  nonAssociation: false,
                  cellId: 2,
                  csra: 'High',
                  csraDetailsUrl: '/prisoner/A222222/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe2, Bob2',
                  viewOffenderDetails: '/prisoner/A222222/cell-move/prisoner-details',
                },
              ],
              spaces: 4,
              type: [
                { code: 'GC', description: 'Gated Cell' },
                { code: 'SPC', description: 'Special Cell' },
              ],
            },
            {
              attributes: [
                { code: 'LC', description: 'Listener Cell' },
                {
                  code: 'SO',
                  description: 'Single occupancy',
                },
              ],
              capacity: 4,
              description: 'MDI-1-3',
              id: 1,
              noOfOccupants: 1,
              occupants: [
                {
                  alerts: [
                    {
                      alertCodes: ['PEEP'],
                      classes: 'alert-status alert-status--medical',
                      label: 'PEEP',
                    },
                  ],
                  nonAssociation: false,
                  cellId: 1,
                  csra: 'Not entered',
                  csraDetailsUrl: '/prisoner/A111111/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe1, Bob1',
                  viewOffenderDetails: '/prisoner/A111111/cell-move/prisoner-details',
                },
              ],
              spaces: 3,
              type: [
                { code: 'LC', description: 'Listener Cell' },
                {
                  code: 'SO',
                  description: 'Single occupancy',
                },
              ],
            },
          ],
        }),
      )
    })

    it('should select the latest csra rating for each occupant', async () => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-3',
          capacity: 4,
          noOfOccupants: 1,
          attributes: [],
        },
      ])
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([
        {
          ...offender,
          firstName: 'bob1',
          lastName: 'doe1',
          offenderNo: 'A111111',
          assignedLivingUnitId: 1,
        },
      ])

      prisonerDetailsService.getAlerts = jest.fn().mockResolvedValue([])

      prisonerDetailsService.getCsraAssessments = jest.fn().mockResolvedValue([
        {
          ...assessment,
          offenderNo: 'A111111',
          assessmentCode: 'CSR',
          assessmentDescription: 'CSR',
          assessmentComment: 'test',
          classification: 'High',
          classificationCode: 'HI',
          assessmentDate: '1980-01-01',
        },
        {
          ...assessment,
          offenderNo: 'A111111',
          assessmentCode: 'CSR',
          assessmentDescription: 'CSR',
          assessmentComment: 'test',
          classification: 'Standard',
          classificationCode: 'STANDARD',
          assessmentDate: '2020-01-01',
        },
      ])

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          cells: [
            {
              attributes: [],
              capacity: 4,
              description: 'MDI-1-3',
              id: 1,
              noOfOccupants: 1,
              occupants: [
                {
                  alerts: [],
                  nonAssociation: false,
                  cellId: 1,
                  csra: 'High',
                  csraDetailsUrl: '/prisoner/A111111/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe1, Bob1',
                  viewOffenderDetails: '/prisoner/A111111/cell-move/prisoner-details',
                },
              ],
              spaces: 3,
              type: false,
            },
          ],
        }),
      )
    })

    it('should not make a call for assessments or alerts when there are no cell occupants', async () => {
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-3',
          capacity: 4,
          noOfOccupants: 1,
          attributes: [],
        },
      ])
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([])
      prisonerDetailsService.getCsraAssessments = jest.fn()
      prisonerDetailsService.getAlerts = jest.fn()

      await controller(req, res)

      expect(prisonerDetailsService.getCsraAssessments.mock.calls.length).toBe(0)
      expect(prisonerDetailsService.getAlerts.mock.calls.length).toBe(0)
    })
  })

  describe('Non associations', () => {
    beforeEach(() => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        offenderNo: 'G6123VU',
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        agencyDescription: 'MOORLAND (HMP & YOI)',
        assignedLivingUnitId: 1,
        assignedLivingUnitDescription: 'MDI-1-1-015',
        nonAssociations: [
          {
            reasonCode: 'RIV',
            reasonDescription: 'Rival Gang',
            typeCode: 'LAND',
            typeDescription: 'Do Not Locate on Same Landing',
            effectiveDate: '2020-06-17T00:00:00',
            expiryDate: '2020-07-17T00:00:00',
            authorisedBy: 'string',
            comments: 'Gang violence',
            offenderNonAssociation: {
              offenderNo: 'A111111',
              firstName: 'bob1',
              lastName: 'doe1',
              reasonCode: 'RIV',
              reasonDescription: 'Rival Gang',
              agencyDescription: 'MOORLAND (HMP & YOI)',
              assignedLivingUnitId: 2,
              assignedLivingUnitDescription: 'MDI-1-3-026',
            },
          },
        ],
      })

      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-3',
          capacity: 4,
          noOfOccupants: 1,
          attributes: [],
        },
      ])
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([
        {
          ...offender,
          firstName: 'bob1',
          lastName: 'doe1',
          offenderNo: 'A111111',
          assignedLivingUnitId: 1,
        },
      ])
      prisonerDetailsService.getAlerts = jest.fn().mockResolvedValue([])
      prisonerDetailsService.getCsraAssessments = jest.fn().mockResolvedValue([])

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
              attributes: [],
              capacity: 4,
              description: 'MDI-1-3',
              id: 1,
              noOfOccupants: 1,
              occupants: [
                {
                  alerts: [],
                  nonAssociation: true,
                  cellId: 1,
                  csra: 'Not entered',
                  csraDetailsUrl: '/prisoner/A111111/cell-move/cell-sharing-risk-assessment-details',
                  name: 'Doe1, Bob1',
                  viewOffenderDetails: '/prisoner/A111111/cell-move/prisoner-details',
                },
              ],
              spaces: 3,
              type: false,
            },
          ],
        }),
      )
    })

    it('should not request the location prefix when there are no non-associations', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue(null)
      await controller(req, res)

      expect(locationService.getLocation.mock.calls.length).toBe(0)
    })

    it('should set show non association value to true when there are res unit level non-associations', async () => {
      locationService.getLocation
        .mockResolvedValueOnce(cellLocationData)
        .mockResolvedValueOnce(parentLocationData)
        .mockResolvedValueOnce(superParentLocationData)
      prisonerCellAllocationService.getCellsWithCapacity = jest.fn().mockResolvedValue([
        {
          id: 1,
          description: 'MDI-1-3',
          capacity: 4,
          noOfOccupants: 1,
          attributes: [
            { description: 'Single occupancy', code: 'SO' },
            { description: 'Listener Cell', code: 'LC' },
          ],
        },
      ])

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
      prisonerDetailsService.getDetails = jest.fn().mockImplementation((_, offenderNo) =>
        Promise.resolve({
          firstName: 'John',
          lastName: 'Doe',
          offenderNo,
          bookingId: someBookingId,
          agencyId: 'MDI',
          csraClassificationCode: 'HI',
          alerts: [
            { ...alert, expired: false, alertCode: 'PEEP' },
            { ...alert, expired: true, alertCode: 'DCC' },
            { ...alert, expired: false, alertCode: 'HA' },
            { ...alert, expired: false, alertCode: 'HA1' },
          ],
          assignedLivingUnit: {
            agencyId: 'MDI',
            locationId: 12345,
            description: '1-2-012',
            agencyName: 'ye olde prisone',
          },
          dateOfBirth: '1990-10-12',
          age: 29,
          assignedLivingUnitId: 5432,
          assignedLivingUnitDesc: '1-1-001',
          categoryCode: 'C',
          alertsDetails: ['PEEP', 'DCC', 'HA', 'HA1'],
          alertsCodes: ['PEEP', 'DCC', 'HA', 'HA1'],
        }),
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
      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          showNonAssociationWarning: false,
        }),
      )
    })

    it('should set show non association value to false when non association offender does not have assigned living unit', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        offenderNo: 'G6123VU',
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        agencyDescription: 'MOORLAND (HMP & YOI)',
        assignedLivingUnitId: 1,
        assignedLivingUnitDescription: 'MDI-1-1-015',
        nonAssociations: [
          {
            reasonCode: 'RIV',
            reasonDescription: 'Rival Gang',
            typeCode: 'LAND',
            typeDescription: 'Do Not Locate on Same Landing',
            effectiveDate: '2020-06-17T00:00:00',
            expiryDate: '2020-07-17T00:00:00',
            comments: 'Gang violence',
            authorisedBy: 'string',
            offenderNonAssociation: {
              offenderNo: 'A111111',
              firstName: 'bob1',
              lastName: 'doe1',
              reasonCode: 'RIV',
              reasonDescription: 'Rival Gang',
              agencyDescription: 'OUTSIDE',
              assignedLivingUnitId: 2,
              assignedLivingUnitDescription: 'MDI-1-1-026',
            },
          },
        ],
      })
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
      prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({
        firstName: 'John',
        lastName: 'Doe',
        offenderNo: someOffenderNumber,
        bookingId: someBookingId,
        agencyId: 'MDI',
        alerts: [],
        assignedLivingUnit: {
          description: 'CSWAP',
        },
      })
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
        offenderNo: someOffenderNumber,
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        agencyDescription: 'MOORLAND (HMP & YOI)',
        assignedLivingUnitId: 1,
        assignedLivingUnitDescription: 'MDI-1-1-015',
        nonAssociations: [],
      })

      await controller(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/selectCell.njk',
        expect.objectContaining({
          prisonerDetails: {
            agencyId: 'MDI',
            alerts: [],
            bookingId: -10,
            firstName: 'John',
            lastName: 'Doe',
            offenderNo: 'A12345',
            assignedLivingUnit: {
              description: 'No cell allocated',
            },
          },
        }),
      )
    })
  })
})
