import considerRisksController from './considerRisks'
import LocationService from '../../services/locationService'
import AnalyticsService from '../../services/analyticsService'
import NonAssociationsService from '../../services/nonAssociationsService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { OffenderDetails } from '../../data/prisonApiClient'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

import config from '../../config'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'
import MetricsService from '../../services/metricsService'
import MetricsEvent from '../../data/metricsEvent'

Reflect.deleteProperty(process.env, 'APPINSIGHTS_INSTRUMENTATIONKEY')

jest.mock('../../services/analyticsService')
jest.mock('../../services/locationService')
jest.mock('../../services/nonAssociationsService')
jest.mock('../../services/prisonerDetailsService')
jest.mock('../../services/prisonerCellAllocationService')

describe('move validation', () => {
  const analyticsService = jest.mocked(new AnalyticsService(undefined))
  const locationService = jest.mocked(new LocationService(undefined, undefined))
  const nonAssociationsService = jest.mocked(new NonAssociationsService(undefined))
  const prisonerDetailsService = jest.mocked(new PrisonerDetailsService(undefined, undefined))
  const prisonerCellAllocationService = jest.mocked(new PrisonerCellAllocationService(undefined, undefined, undefined))
  const metricsService = jest.mocked(new MetricsService(undefined))

  let req
  let res
  let controller

  const systemClientToken = 'system_token'
  const offenderNo = 'ABC123'
  const cellId = 'MDI-1-1-001'

  const cellLocationData = {
    prisonId: 'MDI',
    parentId: 'some-id',
    key: 'MDI-1-1-001',
    pathHierarchy: 'A-1-001',
    capacity: { maxCapacity: 3, workingCapacity: 3 },
  }

  const createAlert = ({
    alertId,
    alertCode,
    alertCodeDescription,
    alertType,
    alertTypeDescription,
    comment,
    dateCreated = '2019-08-20',
  }) => {
    return {
      alertId,
      alertCode,
      alertCodeDescription,
      alertType,
      alertTypeDescription,
      comment,
      active: true,
      addedByFirstName: 'Prison',
      addedByLastName: 'Officer',
      bookingId: 14,
      dateCreated,
      dateExpires: null,
      expired: false,
      expiredByFirstName: 'Prison',
      expiredByLastName: 'Officer',
      offenderNo,
    }
  }
  const offenderDetails: OffenderDetails = {
    bookingId: 1,
    offenderNo: 'ABC123',
    firstName: 'John',
    lastName: 'Smith',
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
    profileInformation: [{ type: 'SEXO', resultValue: 'Homosexual' }],
    alertsDetails: ['X', 'XEL', 'XGANG', 'PEEP', 'XTACT', 'V', 'H', 'R'],
    alertsCodes: ['X', 'XEL', 'XGANG', 'PEEP', 'XTACT', 'V', 'H', 'R'],
    alerts: [
      createAlert({
        alertId: 1,
        alertCode: 'XEL',
        alertCodeDescription: 'E-List',
        alertType: 'X',
        alertTypeDescription: 'Security',
        comment: 'has a large poster on cell wall',
      }),
      createAlert({
        alertId: 1,
        alertCode: 'XGANG',
        alertCodeDescription: 'Gang member',
        alertType: 'X',
        alertTypeDescription: 'Security',
        comment: 'has a large poster on cell wall',
      }),
      createAlert({
        alertId: 2,
        alertCode: 'PEEP',
        alertCodeDescription: 'Peep',
        alertType: 'P',
        alertTypeDescription: 'Peep',
        comment: 'has a large poster on cell wall',
      }),
      createAlert({
        alertId: 3,
        alertCode: 'XTACT',
        alertCodeDescription: 'Gang member',
        alertType: 'X',
        alertTypeDescription: 'Security',
        comment: 'test',
      }),
      createAlert({
        alertId: 4,
        alertCode: 'VIP',
        alertCodeDescription: 'Isolated Prisoner',
        alertType: 'V',
        alertTypeDescription: 'Vulnerability',
        comment: 'test',
      }),
      createAlert({
        alertId: 5,
        alertCode: 'HA',
        alertCodeDescription: 'ACCT open',
        alertType: 'H',
        alertTypeDescription: 'Self Harm',
        comment: 'test',
      }),
      createAlert({
        alertId: 6,
        alertCode: 'HA1',
        alertCodeDescription: 'ACCT post closure',
        alertType: 'H',
        alertTypeDescription: 'Self Harm',
        comment: 'test',
      }),
      createAlert({
        alertId: 7,
        alertCode: 'RTP',
        alertCodeDescription: 'Risk to transgender people',
        alertType: 'R',
        alertTypeDescription: 'Risk',
        comment: 'test',
      }),
      createAlert({
        alertId: 8,
        alertCode: 'RLG',
        alertCodeDescription: 'Risk to LGB',
        alertType: 'X',
        alertTypeDescription: 'Risk to LGB',
        comment: 'has a large poster on cell wall',
      }),
      createAlert({
        alertId: 9,
        alertCode: 'RLG',
        alertCodeDescription: 'Risk to LGB',
        alertType: 'X',
        alertTypeDescription: 'Risk to LGB',
        comment: 'has a large poster on cell wall',
      }),
    ],
  }

  const occupants = [
    {
      cellLocation: '1-1-001',
      prisoners: [
        {
          prisonerNumber: 'A1111',
          firstName: 'Occupant',
          lastName: 'One',
          prisonId: 'MDI',
          prisonName: 'Moorlands',
          cellLocation: '1-1-001',
        },
      ],
    },
    {
      cellLocation: '1-1-001',
      prisoners: [
        {
          prisonerNumber: 'A2222',
          firstName: 'Occupant',
          lastName: 'Two',
          prisonId: 'MDI',
          prisonName: 'Moorlands',
          cellLocation: '1-1-001',
        },
      ],
    },
  ]

  const occupantOneDetails = {
    firstName: 'Occupant',
    lastName: 'One',
    csraClassificationCode: 'HI',
    alerts: [
      createAlert({
        alertId: 1,
        alertCode: 'VIP',
        alertCodeDescription: 'Isolated Prisoner',
        alertType: 'V',
        alertTypeDescription: 'Vulnerability',
        comment: 'test',
        dateCreated: '2020-08-20',
      }),
    ],
  } as unknown as OffenderDetails

  const occupantTwoDetails = {
    firstName: 'Occupant',
    lastName: 'Two',
    csraClassificationCode: 'STANDARD',
    categoryCode: 'B',
    alerts: [
      createAlert({
        alertId: 1,
        alertCode: 'XGANG',
        alertCodeDescription: 'Gang member',
        alertType: 'X',
        alertTypeDescription: 'Security',
        comment: 'has a large poster on cell wall',
      }),
    ],
  } as unknown as OffenderDetails

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
          activeCaseLoad: { caseLoadId: 'MDI' },
          allCaseloads: [{ caseLoadId: 'MDI' }],
          userRoles: ['ROLE_CELL_MOVE'],
        },
        systemClientToken,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    }

    prisonerDetailsService.getDetails = jest.fn()
    locationService.getLocation = jest.fn().mockResolvedValueOnce(cellLocationData)
    analyticsService.sendEvents = jest.fn().mockResolvedValue(Promise.resolve({}))
    metricsService.trackEvent = jest.fn().mockResolvedValue(Promise.resolve({}))
    nonAssociationsService.getNonAssociations = jest.fn().mockResolvedValue({
      prisonerNumber: 'ABC123',
      firstName: 'Fred',
      lastName: 'Bloggs',
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      cellLocation: '1-1-3',
      openCount: 3,
      closedCount: 0,
      nonAssociations: [
        {
          id: 1,
          reason: 'BUL',
          reasonDescription: 'Bullying',
          role: 'VIC',
          roleDescription: 'Victim',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          comment: 'Test comment 1',
          isOpen: true,
          whenCreated: 'string',
          whenUpdated: 'string',
          updatedBy: 'string',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
        {
          id: 2,
          role: 'VIC',
          roleDescription: 'Victim',
          reason: 'BUL',
          reasonDescription: 'Bully',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          comment: 'Test comment 1',
          isOpen: true,
          whenCreated: 'string',
          whenUpdated: 'string',
          updatedBy: 'string',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
        {
          id: 3,
          role: 'PER',
          roleDescription: 'Perp',
          reason: 'RIV',
          reasonDescription: 'Rival gang',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          comment: 'Test comment 2',
          isOpen: true,
          whenCreated: 'string',
          whenUpdated: 'string',
          updatedBy: 'string',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            role: 'VIC',
            roleDescription: 'Victim',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '1-1-3',
          },
        },
        {
          id: 4,
          role: 'VIC',
          roleDescription: 'Victim',
          reason: 'RIV',
          reasonDescription: 'Rival gang',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          comment: 'Test comment 3',
          isOpen: true,
          whenCreated: 'string',
          whenUpdated: 'string',
          updatedBy: 'string',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
      ],
    } as PrisonerNonAssociation)

    controller = considerRisksController({
      analyticsService,
      locationService,
      nonAssociationsService,
      prisonerDetailsService,
      prisonerCellAllocationService,
      metricsService,
    })
  })

  it('Makes the expected API calls on get', async () => {
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(offenderDetails)
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)

    await controller.index(req, res)

    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, offenderNo, true)
    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'ABC123', true)
    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A1111', true)
    expect(prisonerDetailsService.getDetails).toHaveBeenCalledWith(systemClientToken, 'A2222', true)
    expect(nonAssociationsService.getNonAssociations).toHaveBeenCalledWith(systemClientToken, offenderNo)
    expect(locationService.getLocation).toHaveBeenCalledWith(systemClientToken, 'MDI-1-1-001')
    expect(prisonerCellAllocationService.getInmatesAtLocation).toHaveBeenCalledWith(systemClientToken, 'MDI-1-1-001')
  })

  it('Passes the expected data to the template on get', async () => {
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(offenderDetails)
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)

    await controller.index(req, res)

    expect(res.render).toHaveBeenCalledWith('cellMove/considerRisks.njk', {
      categoryWarning: 'a Cat A rating and Occupant One is a Cat not entered and Occupant Two is a Cat B',
      confirmationQuestionLabel:
        'Are you sure you want to move John Smith into a cell with Occupant One and Occupant Two?',
      currentOccupantsWithFormattedActiveAlerts: [
        {
          name: 'Occupant One',
          alerts: [
            {
              title: 'an Isolated Prisoner alert',
              comment: 'test',
              date: 'Date added: 20 August 2020',
            },
          ],
        },
        {
          name: 'Occupant Two',
          alerts: [
            {
              title: 'a Gang member alert',
              comment: 'has a large poster on cell wall',
              date: 'Date added: 20 August 2019',
            },
          ],
        },
      ],
      currentOffenderActiveAlerts: [
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
          date: 'Date added: 20 August 2019',
          title: 'an Isolated Prisoner alert',
        },
        {
          comment: 'test',
          date: 'Date added: 20 August 2019',
          title: 'an ACCT open alert',
        },

        {
          comment: 'test',
          date: 'Date added: 20 August 2019',
          title: 'an ACCT post closure alert',
        },
        {
          comment: 'test',
          date: 'Date added: 20 August 2019',
          title: 'a Risk to transgender people alert',
        },
        {
          comment: 'has a large poster on cell wall',
          date: 'Date added: 20 August 2019',
          title:
            'a Risk to LGB alert and Occupant One has a sexual orientation of not entered and Occupant Two has a sexual orientation of not entered',
        },
        {
          comment: 'has a large poster on cell wall',
          date: 'Date added: 20 August 2019',
          title: 'a Risk to LGB alert and Occupant One has a sexual orientation of not entered',
        },
      ],
      errors: undefined,
      nonAssociations: [
        {
          comment: 'Test comment 2',
          location: '1-1-3',
          name: 'Bloggs, Jim',
          prisonNumber: 'ABC125',
          reason: 'Rival gang',
          type: 'Do Not Locate on Same Wing',
        },
      ],
      offenderNo: 'ABC123',
      currentOffenderName: 'John Smith',
      offendersFormattedNamesWithCsra: [
        'John Smith is CSRA High.',
        'Occupant One is CSRA High.',
        'Occupant Two is CSRA Standard.',
      ],
      prisonerNameForBreadcrumb: 'Smith, John',
      profileUrl: `${config.prisonerProfileUrl}/prisoner/ABC123`,
      selectCellUrl: '/prisoner/ABC123/cell-move/select-cell',
      showOffendersNamesWithCsra: true,
      showRisks: true,
      backUrl: '/prisoner/ABC123/cell-move/select-cell',
    })
  })

  describe('Index', () => {
    it('Should warn that the prisoner is non hetro when occupants have risk to LGBT alert', async () => {
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)

      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...offenderDetails,
          alerts: [],
        })
        .mockResolvedValueOnce({
          ...occupantOneDetails,
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
        .mockResolvedValueOnce({
          ...occupantTwoDetails,
          alerts: [],
        })

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
                  title: 'a Risk to LGB alert and John Smith has a sexual orientation of Homosexual',
                },
              ],
              name: 'Occupant One',
            },
          ],
        }),
      )
    })

    it('Should not show CSRA messages when both prisoner and occupants are standard', async () => {
      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)

      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...offenderDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce({
          ...occupantOneDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce({
          ...occupantTwoDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })

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
          ...offenderDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce({
          ...occupantOneDetails,
          csra: undefined,
          csraClassificationCode: undefined,
        })
        .mockResolvedValueOnce({
          ...occupantTwoDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })

      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)

      await controller.index(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'cellMove/considerRisks.njk',
        expect.objectContaining({
          showOffendersNamesWithCsra: false,
          showRisks: true,
          offendersFormattedNamesWithCsra: [
            'John Smith is CSRA Standard.',
            'Occupant One is CSRA not entered.',
            'Occupant Two is CSRA Standard.',
          ],
        }),
      )
    })

    it('Does not pass alerts and CSRA when there are no occupants', async () => {
      prisonerDetailsService.getDetails.mockResolvedValueOnce({
        ...offenderDetails,
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
        ...offenderDetails,
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

      expect(res.redirect).toHaveBeenCalledWith('/prisoner/ABC123/cell-move/confirm-cell-move?cellId=MDI-1-1-001')
    })

    it('reception as a location has zero non-associations', async () => {
      locationService.getLocation = jest.fn().mockResolvedValue({})
      prisonerCellAllocationService.getInmatesAtLocation = jest.fn().mockResolvedValue([])
      prisonerDetailsService.getDetails
        .mockResolvedValueOnce({
          ...offenderDetails,
          csra: 'Standard',
          csraClassificationCode: 'STANDARD',
        })
        .mockResolvedValueOnce(occupantOneDetails)
        .mockResolvedValueOnce(occupantTwoDetails)

      prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
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
      .mockResolvedValueOnce(offenderDetails)
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)

    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
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
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
    req.body = { confirmation: 'yes' }
    await controller.post(req, res)

    expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=MDI-1-1-001`)
  })

  it('Redirects when the user has changed their mind', async () => {
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(offenderDetails)
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
    req.body = { confirmation: 'no' }
    await controller.post(req, res)

    expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${offenderNo}/cell-move/select-cell`)
  })

  it('Raise ga event and an app insights event on cancel, containing the alert codes for all involved offenders', async () => {
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)
    prisonerDetailsService.getDetails
      .mockResolvedValueOnce(offenderDetails)
      .mockResolvedValueOnce(occupantOneDetails)
      .mockResolvedValueOnce(occupantTwoDetails)
    prisonerCellAllocationService.getInmatesAtLocation.mockResolvedValue(occupants)

    req.query = { offenderNo }
    req.body = { confirmation: 'no' }

    await controller.post(req, res)

    expect(analyticsService.sendEvents).toHaveBeenCalledWith('123456.7654321', [
      {
        name: 'cancelled_on_consider_risks_page',
        params: {
          cell_occupants_alert_codes: 'VIP,XGANG',
          offender_alert_codes: 'XEL,XGANG,VIP,HA,HA1,RTP,RLG,RLG',
        },
      },
    ])

    expect(metricsService.trackEvent).toHaveBeenCalledWith(
      MetricsEvent.CANCELLED_ON_CONSIDER_RISKS_EVENT('MDI', 'XEL,XGANG,VIP,HA,HA1,RTP,RLG,RLG', 'VIP,XGANG'),
    )

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
