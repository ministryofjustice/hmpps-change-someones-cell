import { PrisonApiClient, WhereaboutsApiClient } from '../data'
import { Location, OffenderCell } from '../data/prisonApiClient'
import { LocationGroup } from '../data/whereaboutsApiClient'
import LocationService from './locationService'

jest.mock('../data/prisonApiClient')
jest.mock('../data/whereaboutsApiClient')

const token = 'some token'

describe('Location service', () => {
  let prisonApiClient: jest.Mocked<PrisonApiClient>
  let whereaboutsApiClient: jest.Mocked<WhereaboutsApiClient>
  let locationService: LocationService

  beforeEach(() => {
    prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
    whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
    locationService = new LocationService(prisonApiClient, whereaboutsApiClient)
  })

  describe('searchGroups', () => {
    const locationGroups: LocationGroup[] = [
      { name: 'A Wing', key: 'A', children: [] },
      { name: 'B Wing', key: 'B', children: [] },
    ]

    it('retrieves location groups', async () => {
      whereaboutsApiClient.searchGroups.mockResolvedValue(locationGroups)

      const results = await locationService.searchGroups(token, 'BXI')

      expect(results).toEqual(locationGroups)
    })

    it('Propagates error', async () => {
      whereaboutsApiClient.searchGroups.mockRejectedValue(new Error('some error'))

      await expect(locationService.searchGroups(token, 'BXI')).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getLocation', () => {
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

    it('retrieves location', async () => {
      prisonApiClient.getLocation.mockResolvedValue(location)

      const results = await locationService.getLocation(token, 321)

      expect(results).toEqual(location)
    })

    it('Propagates error', async () => {
      prisonApiClient.getLocation.mockRejectedValue(new Error('some error'))

      await expect(locationService.getLocation(token, 321)).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getAttributesForLocation', () => {
    const cell: OffenderCell = {
      id: 6352,
      description: 'LEI-1-1',
      userDescription: 'LEI-1-1',
      capacity: 2,
      noOfOccupants: 2,
      attributes: [
        {
          code: 'LC',
          description: 'Listener Cell',
        },
      ],
    }

    it('retrieves location', async () => {
      prisonApiClient.getAttributesForLocation.mockResolvedValue(cell)

      const results = await locationService.getAttributesForLocation(token, 6352)

      expect(results).toEqual(cell)
    })

    it('Propagates error', async () => {
      prisonApiClient.getAttributesForLocation.mockRejectedValue(new Error('some error'))

      await expect(locationService.getAttributesForLocation(token, 6352)).rejects.toEqual(new Error('some error'))
    })
  })
})
