import moment from 'moment'
import { getNonAssociationsInEstablishment, getBackLinkData } from './cellMoveUtils'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { OffenderDetails } from '../../data/prisonApiClient'

jest.mock('../../services/prisonerDetailsService')

describe('Cell move utils', () => {
  const nonAssociations = {
    offenderNo: 'ABC123',
    firstName: 'Fred',
    lastName: 'Bloggs',
    agencyDescription: 'Moorland (HMP & YOI)',
    assignedLivingUnitDescription: 'MDI-1-1-3',
    assignedLivingUnitId: 180353,
    nonAssociations: [
      {
        reasonCode: 'VIC',
        reasonDescription: 'Victim',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: moment().add(7, 'days').format('YYYY-MM-DDTHH:mm:ss'),
        expiryDate: null,
        authorisedBy: 'string',
        comments: 'Not effective yet',
        offenderNonAssociation: {
          offenderNo: 'ABC124',
          firstName: 'Andy',
          lastName: 'Adams',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'Moorland (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
        },
      },
      {
        reasonCode: 'VIC',
        reasonDescription: 'Victim',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: moment().format('YYYY-MM-DDTHH:mm:ss'),
        expiryDate: null,
        authorisedBy: 'string',
        comments: 'Effective from today',
        offenderNonAssociation: {
          offenderNo: 'ABC125',
          firstName: 'Brian',
          lastName: 'Blessed',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'Moorland (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
        },
      },
      {
        reasonCode: 'RIV',
        reasonDescription: 'Rival gang',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: moment().subtract(1, 'years').format('YYYY-MM-DDTHH:mm:ss'),
        expiryDate: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss'),
        authorisedBy: 'string',
        comments: 'Effective until tomorrow',
        offenderNonAssociation: {
          offenderNo: 'ABC126',
          firstName: 'Clarence',
          lastName: 'Cook',
          reasonCode: 'RIV',
          reasonDescription: 'Rival gang',
          agencyDescription: 'Moorland (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
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
        comments: 'This one has expired',
        offenderNonAssociation: {
          offenderNo: 'ABC127',
          firstName: 'Dave',
          lastName: 'Digby',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'Moorland (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
        },
      },
      {
        reasonCode: 'VIC',
        reasonDescription: 'Victim',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: '2018-12-01T13:34:00',
        expiryDate: null,
        authorisedBy: 'string',
        comments: 'From an old booking',
        offenderNonAssociation: {
          offenderNo: 'ABC128',
          firstName: 'Emily',
          lastName: 'Egerton',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'OUTSIDE',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
        },
      },
      {
        reasonCode: 'VIC',
        reasonDescription: 'Victim',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: '2018-12-01T13:34:00',
        expiryDate: null,
        authorisedBy: 'string',
        comments: 'From an old booking',
        offenderNonAssociation: {
          offenderNo: 'ABC129',
          firstName: 'Frank',
          lastName: 'Fibonacci',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'Moorland (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-2-1-3',
          assignedLivingUnitId: 123,
        },
      },
      {
        reasonCode: 'VIC',
        reasonDescription: 'Victim',
        typeCode: 'WING',
        typeDescription: 'Do Not Locate on Same Wing',
        effectiveDate: '2018-12-01T13:34:00',
        expiryDate: null,
        authorisedBy: 'string',
        comments: 'Is in an establisment which the user does not have as a caseload',
        offenderNonAssociation: {
          offenderNo: 'ABC130',
          firstName: 'George',
          lastName: 'Gauss',
          reasonCode: 'PER',
          reasonDescription: 'Perpetrator',
          agencyDescription: 'Brixton (HMP)',
          assignedLivingUnitDescription: 'BXI-1-1-1',
          assignedLivingUnitId: 123,
        },
      },
    ],
  }

  const prisonerDetailsService = new PrisonerDetailsService(undefined) as jest.Mocked<PrisonerDetailsService>
  prisonerDetailsService.getDetails.mockImplementation((_, offenderNo): Promise<OffenderDetails> => {
    const agencyId = offenderNo === 'ABC129' ? 'BXI' : 'MDI'

    return Promise.resolve({
      agencyId,
      offenderNo,
      assignedLivingUnit: {
        agencyId,
        locationId: 12345,
        description: '1-2-012',
        agencyName: 'Ye olde prisone',
      },
      bookingId: 1234,
      firstName: 'Test',
      lastName: 'User',
      csraClassificationCode: 'HI',
      alerts: [],
      dateOfBirth: '1990-10-12',
      age: 29,
      assignedLivingUnitId: 5432,
      assignedLivingUnitDesc: '1-1-001',
      categoryCode: 'C',
      alertsDetails: ['XA', 'XVL'],
      alertsCodes: ['XA', 'XVL'],
      assessments: [],
    })
  })

  describe('getNonAssociationsInEstablishment', () => {
    let result

    beforeAll(async () => {
      result = await getNonAssociationsInEstablishment(nonAssociations, 'token', prisonerDetailsService)
    })

    it('returns valid non-associations', async () => {
      expect(result).toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Brian',
            lastName: 'Blessed',
          }),
        }),
      )
      expect(result).toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Clarence',
            lastName: 'Cook',
          }),
        }),
      )
    })

    it('filters out expired non-associations', async () => {
      expect(result).not.toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Dave',
            lastName: 'Digby',
          }),
        }),
      )
    })

    it('filters out not yet effective non-associations', async () => {
      expect(result).not.toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Andy',
            lastName: 'Adams',
          }),
        }),
      )
    })

    it('includes non-associations from old bookings', async () => {
      expect(result).toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Emily',
            lastName: 'Egerton',
          }),
        }),
      )
    })

    it('filters out non-associations with a different current location', async () => {
      expect(result).not.toContainEqual(
        expect.objectContaining({
          offenderNonAssociation: expect.objectContaining({
            firstName: 'Frank',
            lastName: 'Fibonacci',
          }),
        }),
      )
    })
  })

  describe('getBackLinkData', () => {
    it('returns correct back link text for cell search journey', () => {
      const text = getBackLinkData('search-for-cell', 'A12345BC')
      expect(text.backLinkText).toBe('Return to search for a cell')
    })

    it('returns correct back link text for reception move journey', () => {
      const text = getBackLinkData('consider-risks-reception', 'A12345BC')
      expect(text.backLinkText).toBe('Return to consider risks of reception move')
    })

    it('returns correct back link text when neither cell search or reception move journeys', () => {
      const text = getBackLinkData('something else', 'A12345BC')
      expect(text.backLinkText).toBe('Return to select an available cell')
    })
  })
})
