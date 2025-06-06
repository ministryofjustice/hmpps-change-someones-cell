import { Readable } from 'stream'
import { PrisonApiClient } from '../data'
import PrisonerDetailsService from './prisonerDetailsService'
import { Assessment, OffenceDetail, OffenderDetails } from '../data/prisonApiClient'
import { Alert } from '../data/alertsApiClient'
import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'

jest.mock('../data/prisonApiClient')
jest.mock('../data/alertsApiClient')
jest.mock('../data/prisonerSearchApiClient')

const token = 'some token'

describe('Prisoner details service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let alertsApiClient: jest.Mocked<AlertsApiClient>
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  let prisonerDetailsService: PrisonerDetailsService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    alertsApiClient = new AlertsApiClient() as jest.Mocked<AlertsApiClient>
    prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
    prisonerDetailsService = new PrisonerDetailsService(prisonApiClient, prisonerSearchApiClient)
  })

  describe('getImage', () => {
    it('uses prison api to request image data', async () => {
      prisonApiClient.getImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getImage(token, '1234')

      expect(prisonApiClient.getImage).toHaveBeenCalledWith(token, '1234')
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getPrisonerImage', () => {
    it('uses prison api to request image data', async () => {
      prisonApiClient.getPrisonerImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getPrisonerImage(token, 'A1234BC', true)

      expect(prisonApiClient.getPrisonerImage).toHaveBeenCalledWith(token, 'A1234BC', true)
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getDetails', () => {
    const details: OffenderDetails = {
      bookingId: 1234,
      offenderNo: 'A1234',
      firstName: 'Test',
      lastName: 'User',
      csraClassificationCode: 'HI',
      agencyId: 'MDI',
      assignedLivingUnit: {
        agencyId: 'BXI',
        locationId: 5432,
        description: '1-1-001',
        agencyName: 'Brixton (HMP)',
      },
      alerts: [],
      dateOfBirth: '1990-10-12',
      age: 29,
      assignedLivingUnitId: 5432,
      assignedLivingUnitDesc: '1-1-001',
      categoryCode: 'C',
      alertsDetails: ['XA', 'XVL'],
      alertsCodes: ['XA', 'XVL'],
      assessments: [],
    }

    const prisoner: Prisoner = {
      bookingId: 1,
      prisonerNumber: 'A1234',
      firstName: 'JOHN',
      lastName: 'SMITH',
      prisonId: 'MDI',
      prisonName: 'Moorland',
      category: 'C',
      gender: 'Male',
      mostSeriousOffence: 'Robbery',
      alerts: [
        {
          active: true,
          alertCode: 'HA',
          alertType: 'H',
          expired: false,
        },
      ],
    }

    it('retrieves prisoner details', async () => {
      prisonApiClient.getDetails.mockResolvedValue(details)

      const results = await prisonerDetailsService.getDetails(token, 'A1234', true)

      expect(prisonApiClient.getDetails).toHaveBeenCalledWith(token, 'A1234', true)
      expect(results).toEqual(details)
    })

    it('retrieves prisoner details from search', async () => {
      prisonerSearchApiClient.getPrisoner.mockResolvedValue(prisoner)

      const results = await prisonerDetailsService.getPrisoner(token, 'A1234')

      expect(prisonerSearchApiClient.getPrisoner).toHaveBeenCalledWith(token, 'A1234')
      expect(results).toEqual(prisoner)
    })

    it('propagates error', async () => {
      prisonApiClient.getDetails.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getDetails(token, 'A1234', true)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getAlerts', () => {
    const alerts: Alert[] = [
  {
    alertUuid: '123e4567-e89b-12d3-a456-426614174000',
    prisonNumber: 'G3878UK',
    alertCode: {
      alertTypeCode: 'X',
      alertTypeDescription: 'Security',
      code: 'XGANG',
      description: 'Gang member',
    },
    description: 'silly',
    authorisedBy: 'John Smith',
    activeFrom: '2019-08-25',
    activeTo: '2019-09-20',
    isActive: true,
    createdAt: '2019-08-25T10:00:00',
    createdBy: 'USER1234',
    createdByDisplayName: 'John Smith',
    lastModifiedAt: '2021-07-05T10:35:17',
    lastModifiedBy: 'USER5678',
    lastModifiedByDisplayName: 'Jane Smith',
    activeToLastSetAt: '2019-09-20T08:00:00',
    activeToLastSetBy: 'USER5678',
    activeToLastSetByDisplayName: 'Jane Smith',
    madeInactiveAt: '2019-09-20T08:00:00',
    madeInactiveBy: 'USER5678',
    madeInactiveByDisplayName: 'Jane Smith',
    prisonCodeWhenCreated: 'LEI',
  },
]

    it('retrieves alerts', async () => {
      alertsApiClient.getAlerts.mockResolvedValue(alerts)

      const results = await prisonerDetailsService.getAlerts(token, ['A1234'])

      expect(alertsApiClient.getAlerts).toHaveBeenCalledWith(token, ['A1234'])
      expect(results).toEqual(alerts)
    })

    it('propagates error', async () => {
      alertsApiClient.getAlerts.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getAlerts(token, ['A1234'])).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getCsraAssessments', () => {
    const assessments: Assessment[] = [
      {
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
      },
    ]

    it('retrieves CSRA assessments', async () => {
      prisonApiClient.getCsraAssessments.mockResolvedValue(assessments)

      const results = await prisonerDetailsService.getCsraAssessments(token, ['A1234'])

      expect(prisonApiClient.getCsraAssessments).toHaveBeenCalledWith(token, ['A1234'])
      expect(results).toEqual(assessments)
    })

    it('propagates error', async () => {
      prisonApiClient.getCsraAssessments.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getCsraAssessments(token, ['A1234'])).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getMainOffence', () => {
    const offences: OffenceDetail[] = [
      {
        bookingId: 1123456,
        offenceDescription: 'string',
        offenceCode: 'RR84070',
        statuteCode: 'RR84',
      },
    ]

    it('retrieves alerts', async () => {
      prisonApiClient.getMainOffence.mockResolvedValue(offences)

      const results = await prisonerDetailsService.getMainOffence(token, 456)

      expect(prisonApiClient.getMainOffence).toHaveBeenCalledWith(token, 456)
      expect(results).toEqual(offences)
    })

    it('propagates error', async () => {
      prisonApiClient.getMainOffence.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getMainOffence(token, 456)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getPrisoners', () => {
    const offenderNos = ['A1234BC', 'B1234CD']

    const prisoners: Prisoner[] = [
      {
        prisonerNumber: 'A0000AA',
        firstName: 'Thorfinn',
        middleName: 'Skull-splitter',
        lastName: 'Torf-Einarsson',
        gender: 'Female',
        bookingId: 1,
        prisonId: 'WRI',
        prisonName: 'Whitemoor (HMP)',
        cellLocation: 'B-3-018',
        alerts: [],
      },
    ]

    it('retrieves prisoners', async () => {
      prisonerSearchApiClient.getPrisoners.mockResolvedValue(prisoners)

      const results = await prisonerDetailsService.getPrisoners(token, offenderNos)

      expect(prisonerSearchApiClient.getPrisoners).toHaveBeenCalledWith(token, offenderNos)
      expect(results).toEqual(prisoners)
    })

    it('propagates error', async () => {
      prisonerSearchApiClient.getPrisoners.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getPrisoners(token, offenderNos)).rejects.toEqual(new Error('some error'))
    })
  })
})
