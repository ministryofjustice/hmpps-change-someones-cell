import { NonAssociationsApiClient } from '../data'
import { PrisonerNonAssociation } from '../data/nonAssociationsApiClient'
import NonAssociationsService from './nonAssociationsService'

jest.mock('../data/nonAssociationsApiClient')

const token = 'some token'

describe('Non-associations service', () => {
  let nonAssociationsApiClient: jest.Mocked<NonAssociationsApiClient>
  let nonAssociationsService: NonAssociationsService

  describe('getNonAssociations', () => {
    beforeEach(() => {
      nonAssociationsApiClient = new NonAssociationsApiClient() as jest.Mocked<NonAssociationsApiClient>
      nonAssociationsService = new NonAssociationsService(nonAssociationsApiClient)
    })

    const nonAssociations: PrisonerNonAssociation = {
      prisonerNumber: '1234',
      firstName: 'Ezmerelda',
      lastName: 'Humperdink',
      prisonName: 'Leeds (HMP)',
      cellLocation: '1-1-1-001',
      prisonId: 'LEI',
      openCount: 0,
      closedCount: 0,
      nonAssociations: [],
    }

    it('Retrieves and formats user name', async () => {
      nonAssociationsApiClient.getNonAssociations.mockResolvedValue(nonAssociations)

      const results = await nonAssociationsService.getNonAssociations(token, 'BXI')

      expect(results).toEqual(nonAssociations)
    })

    it('Propagates error', async () => {
      nonAssociationsApiClient.getNonAssociations.mockRejectedValue(new Error('some error'))

      await expect(nonAssociationsService.getNonAssociations(token, 'BXI')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })
})
