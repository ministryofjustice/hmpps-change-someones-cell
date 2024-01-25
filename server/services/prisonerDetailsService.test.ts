import { Readable } from 'stream'
import { PrisonApiClient } from '../data'
import PrisonerDetailsService from './prisonerDetailsService'
import { Alert, Assessment, OffenderDetails } from '../data/prisonApiClient'

jest.mock('../data/prisonApiClient')

const token = 'some token'

describe('Prisoner details service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let prisonerDetailsService: PrisonerDetailsService

  describe('getImage', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

    it('uses prison api to request image data', async () => {
      prisonApiClient.getImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getImage(token, '1234')

      expect(prisonApiClient.getImage).toHaveBeenCalledWith(token, '1234')
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getPrisonerImage', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

    it('uses prison api to request image data', async () => {
      prisonApiClient.getPrisonerImage.mockResolvedValue(Readable.from('image data'))

      const result = await prisonerDetailsService.getPrisonerImage(token, 'A1234BC', true)

      expect(prisonApiClient.getPrisonerImage).toHaveBeenCalledWith(token, 'A1234BC', true)
      expect(result.read()).toEqual('image data')
    })
  })

  describe('getDetails', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

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
    }

    it('retrieves prisoner details', async () => {
      prisonApiClient.getDetails.mockResolvedValue(details)

      const results = await prisonerDetailsService.getDetails(token, 'A1234', true)

      expect(prisonApiClient.getDetails).toHaveBeenCalledWith(token, 'A1234', true)
      expect(results).toEqual(details)
    })

    it('propagates error', async () => {
      prisonApiClient.getDetails.mockRejectedValue(new Error('some error'))

      await expect(prisonerDetailsService.getDetails(token, 'A1234', true)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getAlerts', () => {
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

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
    beforeEach(() => {
      prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
      prisonerDetailsService = new PrisonerDetailsService(prisonApiClient)
    })

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
})
