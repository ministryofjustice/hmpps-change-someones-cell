import { WhereaboutsApiClient } from '../data'
import { LocationGroup } from '../data/whereaboutsApiClient'
import LocationService from './locationService'

jest.mock('../data/whereaboutsApiClient')

const token = 'some token'

describe('Location service', () => {
  let whereaboutsApiClient: jest.Mocked<WhereaboutsApiClient>
  let locationService: LocationService

  describe('searchGroups', () => {
    beforeEach(() => {
      whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
      locationService = new LocationService(whereaboutsApiClient)
    })

    const locationGroups: LocationGroup[] = [
      { name: 'A Wing', key: 'A', children: [] },
      { name: 'B Wing', key: 'B', children: [] },
    ]

    it('Retrieves and formats user name', async () => {
      whereaboutsApiClient.searchGroups.mockResolvedValue(locationGroups)

      const results = await locationService.searchGroups(token, 'BXI')

      expect(results).toEqual(locationGroups)
    })

    it('Propagates error', async () => {
      whereaboutsApiClient.searchGroups.mockRejectedValue(new Error('some error'))

      await expect(locationService.searchGroups(token, 'BXI')).rejects.toEqual(new Error('some error'))
    })
  })
})
