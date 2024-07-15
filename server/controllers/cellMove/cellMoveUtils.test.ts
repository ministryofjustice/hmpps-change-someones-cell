import moment from 'moment'
import { getNonAssociationsInEstablishment, getBackLinkData } from './cellMoveUtils'
import { PrisonerNonAssociation } from '../../data/nonAssociationsApiClient'

jest.mock('../../services/prisonerDetailsService')

describe('Cell move utils', () => {
  const nonAssociations: PrisonerNonAssociation = {
    prisonerNumber: 'ABC123',
    firstName: 'Fred',
    lastName: 'Bloggs',
    prisonId: 'MDI',
    prisonName: 'Moorland (HMP & YOI)',
    cellLocation: 'MDI-1-1-3',
    openCount: 2,
    closedCount: 0,
    nonAssociations: [
      {
        id: 1,
        reason: 'GANG',
        reasonDescription: 'Rival Gang',
        role: 'VIC',
        roleDescription: 'Victim',
        restrictionType: 'WING',
        restrictionTypeDescription: 'Do Not Locate on Same Wing',
        comment: 'Effective from today',
        isOpen: true,
        updatedBy: 'Test',
        whenCreated: moment().format('YYYY-MM-DDTHH:mm:ss'),
        whenUpdated: moment().format('YYYY-MM-DDTHH:mm:ss'),
        otherPrisonerDetails: {
          prisonerNumber: 'ABC125',
          firstName: 'Brian',
          lastName: 'Blessed',
          role: 'PER',
          roleDescription: 'Perpetrator',
          prisonId: 'MDI',
          prisonName: 'Moorland (HMP & YOI)',
          cellLocation: 'MDI-2-1-3',
        },
      },
      {
        id: 2,
        reason: 'GANG',
        reasonDescription: 'Rival Gang',
        role: 'RIV',
        roleDescription: 'Rival gang',
        restrictionType: 'WING',
        restrictionTypeDescription: 'Do Not Locate on Same Wing',
        updatedBy: 'Test',
        comment: 'Effective until tomorrow',
        isOpen: true,
        whenCreated: moment().format('YYYY-MM-DDTHH:mm:ss'),
        whenUpdated: moment().format('YYYY-MM-DDTHH:mm:ss'),
        otherPrisonerDetails: {
          prisonerNumber: 'ABC126',
          firstName: 'Clarence',
          lastName: 'Cook',
          role: 'RIV',
          roleDescription: 'Rival gang',
          prisonId: 'MDI',
          prisonName: 'Moorland (HMP & YOI)',
          cellLocation: 'MDI-2-1-3',
        },
      },
    ],
  }

  describe('getNonAssociationsInEstablishment', () => {
    let result

    beforeAll(async () => {
      result = await getNonAssociationsInEstablishment(nonAssociations)
    })

    it('returns valid non-associations', async () => {
      expect(result).toContainEqual(
        expect.objectContaining({
          otherPrisonerDetails: expect.objectContaining({
            firstName: 'Brian',
            lastName: 'Blessed',
          }),
        }),
      )
      expect(result).toContainEqual(
        expect.objectContaining({
          otherPrisonerDetails: expect.objectContaining({
            firstName: 'Clarence',
            lastName: 'Cook',
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
