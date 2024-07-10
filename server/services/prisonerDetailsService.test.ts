import { Readable } from 'stream'
import { PrisonApiClient } from '../data'
import PrisonerDetailsService from './prisonerDetailsService'
import { Alert, Assessment, OffenceDetail, OffenderDetails, PrisonerDetail } from '../data/prisonApiClient'
import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'

jest.mock('../data/prisonApiClient')
jest.mock('../data/prisonerSearchApiClient')

const token = 'some token'

describe('Prisoner details service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>
  let prisonerDetailsService: PrisonerDetailsService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
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
      },
    ]

    it('retrieves alerts', async () => {
      prisonApiClient.getAlerts.mockResolvedValue(alerts)

      const results = await prisonerDetailsService.getAlerts(token, 'BXI', ['A1234'])

      expect(prisonApiClient.getAlerts).toHaveBeenCalledWith(token, 'BXI', ['A1234'])
      expect(results).toEqual(alerts)
    })

    it('propagates error', async () => {
      prisonApiClient.getAlerts.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getAlerts(token, 'BXI', ['A1234'])).rejects.toEqual(new Error('some error'))
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

    const prisoners: PrisonerDetail[] = [
      {
        offenderNo: 'A0000AA',
        title: 'Earl',
        suffix: 'Mac',
        firstName: 'Thorfinn',
        middleNames: 'Skull-splitter',
        lastName: 'Torf-Einarsson',
        dateOfBirth: '1960-02-29',
        gender: 'Female',
        sexCode: 'F',
        nationalities: 'Scottish',
        currentlyInPrison: 'N',
        latestBookingId: 1,
        latestLocationId: 'WRI',
        latestLocation: 'Whitemoor (HMP)',
        internalLocation: 'WRI-B-3-018',
        pncNumber: '01/000000A',
        croNumber: '01/0001/01A',
        ethnicity: 'White: British',
        ethnicityCode: 'W1',
        birthCountry: 'Norway',
        religion: 'Pagan',
        religionCode: 'PAG',
        convictedStatus: 'Convicted',
        legalStatus: 'REMAND',
        imprisonmentStatus: 'LIFE',
        imprisonmentStatusDesc: 'Service Life Imprisonment',
        receptionDate: '1980-01-01',
        maritalStatus: 'Single',
        currentWorkingFirstName: 'Thorfinn',
        currentWorkingLastName: 'Torf-Einarsson',
        currentWorkingBirthDate: '1960-02-29',
      },
    ]

    it('retrieves prisoners', async () => {
      prisonApiClient.getPrisoners.mockResolvedValue(prisoners)

      const results = await prisonerDetailsService.getPrisoners(token, offenderNos)

      expect(prisonApiClient.getPrisoners).toHaveBeenCalledWith(token, offenderNos)
      expect(results).toEqual(prisoners)
    })

    it('propagates error', async () => {
      prisonApiClient.getPrisoners.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getPrisoners(token, offenderNos)).rejects.toEqual(new Error('some error'))
    })
  })
})
