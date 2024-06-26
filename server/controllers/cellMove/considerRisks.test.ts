import moment from 'moment'
import considerRisksController from './considerRisks'
import LocationService from '../../services/locationService'
import AnalyticsService from '../../services/analyticsService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { OffenderDetails } from '../../data/prisonApiClient'
import config from '../../config'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/analyticsService')
jest.mock('../../services/locationService')
jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerCellAllocationService')
jest.mock('../../services/prisonerDetailsService')

describe('move validation', () => {
  const analyticsService = jest.mocked(new AnalyticsService(undefined))
  const locationService = jest.mocked(new LocationService(undefined, undefined, undefined))
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined, undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined))

  let req
  let res
  let controller

  const offenderNo = 'ABC123'
  const cellId = 1

  const cellLocationData = {
    parentLocationId: 2,
  }

  const parentLocationData = {
    parentLocationId: 3,
  }

  const superParentLocationData = {
    locationPrefix: 'MDI-1',
  }

  const getCurrentOffenderDetailsResponse: OffenderDetails = {
    bookingId: 1234,
    offenderNo: 'A12345',
    firstName: 'Test',
    lastName: 'User',
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
    alerts: [
      {
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        alertCode: 'RLG',
        alertCodeDescription: 'Risk to LGB',
        alertId: 1,
        alertType: 'X',
        alertTypeDescription: 'Risk to LGB',
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
        alertCode: 'XEL',
        alertCodeDescription: 'E-List',
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
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        alertCode: 'PEEP',
        alertCodeDescription: 'Peep',
        alertId: 1,
        alertType: 'P',
        alertTypeDescription: 'Peep',
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
        alertCode: 'XTACT',
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
        bookingId: 14,
        offenderNo,
        dateExpires: null,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
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
        bookingId: 14,
        offenderNo,
        dateExpires: null,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
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
        bookingId: 14,
        offenderNo,
        dateExpires: null,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
      },
      {
        alertId: 6,
        alertType: 'R',
        alertTypeDescription: 'Risk',
        alertCode: 'RTP',
        alertCodeDescription: 'Risk to transgender people',
        comment: 'test',
        dateCreated: '2020-09-21',
        expired: false,
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        bookingId: 14,
        offenderNo,
        dateExpires: null,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
      },
    ],
    profileInformation: [],
  }

  const getCurrentOccupierDetailsResponse: OffenderDetails = {
    bookingId: 1235,
    firstName: 'Occupant',
    lastName: 'One',
    csra: 'High',
    csraClassificationCode: 'HI',
    agencyId: 'MDI',
    offenderNo: 'A12346',
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
        active: true,
        addedByFirstName: 'John',
        addedByLastName: 'Smith',
        alertCode: 'PEEP',
        alertCodeDescription: 'Peep',
        alertId: 1,
        alertType: 'P',
        alertTypeDescription: 'Peep',
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
        alertCode: 'XTACT',
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
        bookingId: 14,
        offenderNo,
        dateExpires: null,
        expiredByFirstName: 'John',
        expiredByLastName: 'Smith',
      },
    ],
    profileInformation: [{ type: 'SEXO', resultValue: 'Homosexual' }],
  }

  const getAnotherCurrentOccupierDetailsResponse: OffenderDetails = {
    bookingId: 1235,
    firstName: 'Occupant',
    categoryCode: 'B',
    lastName: 'Two',
    csra: 'Standard',
    csraClassificationCode: 'STANDARD',
    agencyId: 'MDI',
    offenderNo: 'A12347',
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
    profileInformation: [{ type: 'SEXO' }],
  }

  const offender = {
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
    alertsDetails: ['XA', 'XVL'],
    alertsCodes: ['XA', 'XVL'],
  }

  const systemClientToken = 'system_token'

  beforeEach(() => {
    req = {
      originalUrl: 'http://localhost',
      params: { offenderNo },
      query: { cellId },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost'),
      session: { userDetails: { username: 'me' } },
      cookies: {
        _ga: 'GA1.1.123456.7654321',
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
      redirect: jest.fn(),
    }

    prisonerDetailsService.getDetails = jest.fn()
    prisonerCellAllocationService.getInmatesAtLocation = jest.fn()
    locationService.getLocation = jest
      .fn()
      .mockResolvedValueOnce(cellLocationData)
      .mockResolvedValueOnce(parentLocationData)
      .mockResolvedValueOnce(superParentLocationData)
    analyticsService.sendEvents = jest.fn().mockResolvedValue(Promise.resolve({}))
    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
      offenderNo: 'ABC123',
      firstName: 'Fred',
      lastName: 'Bloggs',
      agencyDescription: 'Moorland (HMP & YOI)',
      assignedLivingUnitDescription: 'MDI-1-1-3',
      nonAssociations: [
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:ss'),
          authorisedBy: 'string',
          comments: 'Test comment 1',
          offenderNonAssociation: {
            offenderNo: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
          authorisedBy: 'string',
          comments: 'Test comment 1',
          offenderNonAssociation: {
            offenderNo: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
        {
          reasonCode: 'RIV',
          reasonDescription: 'Rival gang',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: moment().subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss'),
          authorisedBy: 'string',
          comments: 'Test comment 2',
          offenderNonAssociation: {
            offenderNo: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            reasonCode: 'RIV',
            reasonDescription: 'Rival gang',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-1-1-3',
          },
        },
        {
          reasonCode: 'VIC',
          reasonDescription: 'Victim',
          typeCode: 'WING',
          typeDescription: 'Do Not Locate on Same Wing',
          effectiveDate: '2018-12-01T13:34:00',
          expiryDate: '2019-12-01T13:34:00',
          authorisedBy: 'string',
          comments: 'Test comment 3',
          offenderNonAssociation: {
            offenderNo: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            reasonCode: 'PER',
            reasonDescription: 'Perpetrator',
            agencyDescription: 'Moorland (HMP & YOI)',
            assignedLivingUnitDescription: 'MDI-2-1-3',
          },
        },
      ],
    })

    controller = considerRisksController({
      analyticsService,
      locationService,
      nonAssociationsService,
      prisonerCellAllocationService,
      prisonerDetailsService,
    })
  })

  it('Makes the expected API calls on get', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)

    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
    await controller.index(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, offenderNo, true)
    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A12346', true)
    expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, offenderNo)
    expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 1)
    expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 2)
    expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 3)
    expect(prisonerCellAllocationService.getInmatesAtLocation).toHaveBeenCalledWith(systemClientToken, 1)
  })

  it('Passes the expected data to the template on get', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)
      .mockResolvedValueOnce(getAnotherCurrentOccupierDetailsResponse)

    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([
      { ...offender, offenderNo: 'A12346' },
      { ...offender, offenderNo: 'A12347' },
    ])
    await controller.index(req, res)

    expect(res.render).toHaveBeenCalledWith('cellMove/considerRisks.njk', {
      categoryWarning: 'a Cat A rating and Occupant One is a Cat not entered and Occupant Two is a Cat B',
      confirmationQuestionLabel:
        'Are you sure you want to move Test User into a cell with Occupant One and Occupant Two?',
      currentOccupantsWithFormattedActiveAlerts: [
        {
          alerts: [
            {
              comment: 'has a large poster on cell wall',
              date: 'Date added: 20 August 2019',
              title: 'a Gang member alert',
            },
            {
              comment: 'test',
              date: 'Date added: 20 August 2020',
              title: 'an Isolated Prisoner alert',
            },
          ],
          name: 'Occupant One',
        },
      ],
      currentOffenderActiveAlerts: [
        {
          comment: 'has a large poster on cell wall',
          date: 'Date added: 20 August 2019',
          title:
            'a Risk to LGB alert and Occupant One has a sexual orientation of Homosexual and Occupant Two has a sexual orientation of not entered',
        },
        {
          comment: 'has a large poster on cell wall',
          date: 'Date added: 20 August 2019',
          title: 'an E-List alert',
        },
        {
          comment: 'has a large poster on cell wall',
          date: 'Date added: 20 August 2019',
          title: 'a Gang member alert',
        },
        {
          comment: 'test',
          date: 'Date added: 20 August 2020',
          title: 'an Isolated Prisoner alert',
        },
        {
          comment: 'Test comment',
          date: 'Date added: 18 February 2021',
          title: 'an ACCT open alert',
        },
        {
          comment: '',
          date: 'Date added: 19 February 2021',
          title: 'an ACCT post closure alert',
        },
        {
          comment: 'test',
          date: 'Date added: 21 September 2020',
          title: 'a Risk to transgender people alert',
        },
      ],
      errors: undefined,
      nonAssociations: [
        {
          comment: 'Test comment 2',
          location: 'MDI-1-1-3',
          name: 'Bloggs, Jim',
          prisonNumber: 'ABC125',
          reason: 'Rival gang',
          type: 'Do Not Locate on Same Wing',
        },
      ],
      offenderNo: 'ABC123',
      currentOffenderName: 'Test User',
      offendersFormattedNamesWithCsra: [
        'Test User is CSRA High.',
        'Occupant One is CSRA High.',
        'Occupant Two is CSRA Standard.',
      ],
      prisonerNameForBreadcrumb: 'User, Test',
      profileUrl: `${config.prisonerProfileUrl}/prisoner/ABC123`,
      selectCellUrl: '/prisoner/ABC123/cell-move/select-cell',
      showOffendersNamesWithCsra: true,
      showRisks: true,
      backUrl: '/prisoner/ABC123/cell-move/select-cell',
    })
  })

  describe('Index', () => {
    it('Should warn that the prisoner is non hetro when occupants have risk to LGBT alert', async () => {
      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...getCurrentOffenderDetailsResponse,
          profileInformation: [{ type: 'SEXO', resultValue: 'Homosexual' }],
          alerts: [],
        })
        .mockResolvedValueOnce({
          ...getCurrentOccupierDetailsResponse,
          alerts: [
            {
              active: true,
              addedByFirstName: 'John',
              addedByLastName: 'Smith',
              alertCode: 'RLG',
              alertCodeDescription: 'Risk to LGB',
              alertId: 1,
              alertType: 'X',
              alertTypeDescription: 'Risk to LGB',
              bookingId: 14,
              comment: 'alert comment',
              dateCreated: '2019-08-20',
              dateExpires: null,
              expired: false,
              expiredByFirstName: 'John',
              expiredByLastName: 'Smith',
              offenderNo,
            },
          ],
        })

      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          currentOffenderActiveAlerts: [],
          currentOccupantsWithFormattedActiveAlerts: [
            {
              alerts: [
                {
                  comment: 'alert comment',
                  date: 'Date added: 20 August 2019',
                  title: 'a Risk to LGB alert and Test User has a sexual orientation of Homosexual',
                },
              ],
              name: 'Occupant One',
            },
          ],
        }),
      )
    })

    it('Should not show CSRA messages when both prisoner and occupants are standard', async () => {
      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...getCurrentOffenderDetailsResponse,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce({
          ...getCurrentOccupierDetailsResponse,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          showOffendersNamesWithCsra: false,
          showRisks: true,
        }),
      )
    })

    it('Should not show CSRA message when a pisoner or occupant has no csra rating', async () => {
      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...getCurrentOffenderDetailsResponse,
          csra: undefined,
          csraClassificationCode: undefined,
        })
        .mockResolvedValueOnce({
          ...getCurrentOccupierDetailsResponse,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          showOffendersNamesWithCsra: false,
          showRisks: true,
          offendersFormattedNamesWithCsra: ['Test User is CSRA not entered.', 'Occupant One is CSRA Standard.'],
        }),
      )
    })

    it('Does not pass alerts and CSRA when there are no occupants', async () => {
      prisonerDetailsService.getDetails.mockResolvedValueOnce({
        ...getCurrentOffenderDetailsResponse,
        csra: 'Standard',
        categoryCode: 'C',
      })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([])
      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          categoryWarning: false,
          currentOffenderActiveAlerts: false,
          currentOccupantsWithFormattedActiveAlerts: [],
          showOffendersNamesWithCsra: false,
          showRisks: false,
        }),
      )
    })

    it('Passes the correct conditional data to the template when there are no inmates at the location', async () => {
      prisonerDetailsService.getDetails.mockResolvedValueOnce({
        ...getCurrentOffenderDetailsResponse,
        csra: 'Standard',
      })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([])

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          categoryWarning: false,
          confirmationQuestionLabel: 'Are you sure you want to select this cell?',
          showOffendersNamesWithCsra: false,
          showRisks: false,
        }),
      )
    })

    it('Redirects to confirm cell move when there are no warnings', async () => {
      nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({})
      prisonerDetailsService.getDetails = jest.fn().mockResolvedValue({ firstName: 'Bob', lastName: 'Doe', alerts: [] })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([])

      await controller.index(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/ABC123/cell-move/confirm-cell-move?cellId=1')
    })

    it('reception as a location has zero non-associations', async () => {
      locationService.getLocation = jest.fn().mockResolvedValue({})
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([])
      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...getCurrentOffenderDetailsResponse,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce({
          ...getCurrentOccupierDetailsResponse,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          nonAssociations: [],
        }),
      )
    })
  })

  describe('Post', () => {})
  it('Redirects when form has been triggered with no data', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
    req.body = {}
    await controller.post(req, res)

    expect(res.render).toHaveBeenCalledWith(
      'cellMove/considerRisks.njk',
      expect.objectContaining({
        errors: [{ href: '#confirmation', text: 'Select yes if you are sure you want to select the cell' }],
      }),
    )
  })

  it('Redirects when the user has confirmed they are happy', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
    req.body = { confirmation: 'yes' }
    await controller.post(req, res)

    expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=1`)
  })

  it('Redirects when the user has changed their mind', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([{ ...offender, offenderNo: 'A12346' }])
    req.body = { confirmation: 'no' }
    await controller.post(req, res)

    expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${offenderNo}/cell-move/select-cell`)
  })

  it('Raise ga event on cancel, containing the alert codes for all involed offenders', async () => {
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue([
      { ...offender, offenderNo: 'A12346' },
      { ...offender, offenderNo: 'A12421' },
    ])
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(getCurrentOffenderDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)
      .mockResolvedValueOnce(getCurrentOccupierDetailsResponse)

    req.query = { offenderNo }
    req.body = { confirmation: 'no' }

    await controller.post(req, res)

    expect(analyticsService.sendEvents).toHaveBeenCalledWith('123456.7654321', [
      {
        name: 'cancelled_on_consider_risks_page',
        params: {
          cell_occupants_alert_codes: 'XGANG,VIP',
          offender_alert_codes: 'RLG,XEL,XGANG,VIP,HA,HA1,RTP',
        },
      },
    ])

    expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${offenderNo}/cell-move/select-cell`)
  })

  it('should set correct redirect links and rethrow error', async () => {
    const error = new Error('Network error')
    prisonerDetailsService.getDetails = jest.fn().mockRejectedValue(error)

    req.body = { confirmation: 'no' }

    await expect(controller.post(req, res)).rejects.toThrow(error)
    expect(res.locals.redirectUrl).toBe(`/prisoner/${offenderNo}/cell-move/select-cell`)
    expect(res.locals.homeUrl).toBe(`${config.prisonerProfileUrl}/prisoner/${offenderNo}`)
  })
})
