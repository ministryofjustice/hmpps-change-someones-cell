import { PrisonRegisterApiClient, LocationsInsidePrisonApiClient } from '../data'
import { LocationGroup, LocationPrefix, Location, LocationInfo } from '../data/locationsInsidePrisonApiClient'
import LocationService from './locationService'
import { SanitisedError } from '../sanitisedError'

jest.mock('../data/prisonRegisterApiClient')
jest.mock('../data/locationsInsidePrisonApiClient')

const prisonRegisterApiClient = new PrisonRegisterApiClient() as jest.Mocked<PrisonRegisterApiClient>
const locationsInsidePrisonApiClient =
  new LocationsInsidePrisonApiClient() as jest.Mocked<LocationsInsidePrisonApiClient>

const token = 'some token'

describe('Location service', () => {
  let locationService: LocationService

  beforeEach(() => {
    jest.resetAllMocks()

    locationService = new LocationService(prisonRegisterApiClient, locationsInsidePrisonApiClient)
  })

  describe('searchGroups', () => {
    const locationGroups: LocationGroup[] = [
      { name: 'A Wing', key: 'A', children: [] },
      { name: 'B Wing', key: 'B', children: [{ name: 'child-B', key: 'child-B', children: [] }] },
      {
        name: 'C Wing',
        key: 'C',
        children: [
          { name: 'child-C1', key: 'child-C1', children: [] },
          { name: 'child-C2', key: 'child-C2', children: [] },
        ],
      },
    ]

    const locationGroupsWithSingleChildrenReduced: LocationGroup[] = [
      { name: 'A Wing', key: 'A', children: [] },
      { name: 'B Wing', key: 'B', children: [] },
      {
        name: 'C Wing',
        key: 'C',
        children: [
          { name: 'child-C1', key: 'child-C1', children: [] },
          { name: 'child-C2', key: 'child-C2', children: [] },
        ],
      },
    ]

    it('retrieves location groups and reduces single children to empty array', async () => {
      locationsInsidePrisonApiClient.searchGroups.mockResolvedValue(locationGroups)
      const results = await locationService.searchGroups(token, 'BXI')
      expect(locationsInsidePrisonApiClient.searchGroups).toHaveBeenCalledTimes(1)
      expect(results).toEqual(locationGroupsWithSingleChildrenReduced)
    })
    it('Propagates error', async () => {
      locationsInsidePrisonApiClient.searchGroups.mockRejectedValue(new Error('some error'))
      await expect(locationService.searchGroups(token, 'BXI')).rejects.toEqual(new Error('some error'))
    })
  })

  describe('Active Prison check', () => {
    const info: LocationInfo = {
      activeAgencies: ['MDI', 'BXI'],
    }

    it('returns false for all prisons if empty', async () => {
      locationsInsidePrisonApiClient.getActiveAgenciesInLocationService.mockResolvedValue({
        activeAgencies: [],
      })

      const results = await locationService.getActiveAgenciesInLocationService(token, 'LEI')

      expect(results).toEqual(false)
    })

    it('returns true for all prisons', async () => {
      locationsInsidePrisonApiClient.getActiveAgenciesInLocationService.mockResolvedValue({
        activeAgencies: ['***'],
      })

      const results = await locationService.getActiveAgenciesInLocationService(token, 'PVI')

      expect(results).toEqual(true)
    })

    it('returns true for Brixton', async () => {
      locationsInsidePrisonApiClient.getActiveAgenciesInLocationService.mockResolvedValue(info)

      const results = await locationService.getActiveAgenciesInLocationService(token, 'BXI')

      expect(results).toEqual(true)
    })

    it('returns false for Leeds', async () => {
      locationsInsidePrisonApiClient.getActiveAgenciesInLocationService.mockResolvedValue(info)

      const results = await locationService.getActiveAgenciesInLocationService(token, 'LEI')

      expect(results).toEqual(false)
    })
  })

  describe('getLocation', () => {
    const location: Location = {
      prisonId: 'ABC',
      parentId: 'ABC-1',
      key: 'ABC-1-1-5',
      pathHierarchy: '1-1-5',
      capacity: { workingCapacity: 2, maxCapacity: 2 },
    }

    it('retrieves location', async () => {
      locationsInsidePrisonApiClient.getLocation.mockResolvedValue(location)

      const results = await locationService.getLocation(token, 'ABC-1-1-5')

      expect(results).toEqual(location)
    })

    it('Propagates error', async () => {
      locationsInsidePrisonApiClient.getLocation.mockRejectedValue(new Error('some error'))

      await expect(locationService.getLocation(token, 'ABC-1-1-5')).rejects.toEqual(new Error('some error'))
    })
  })

  describe('getAgencyGroupLocationPrefix', () => {
    const locationPrefix: LocationPrefix = {
      locationPrefix: 'MDI-1-',
    }

    it('retrieves location prefix', async () => {
      locationsInsidePrisonApiClient.getAgencyGroupLocationPrefix.mockResolvedValue(locationPrefix)

      const result = await locationService.getAgencyGroupLocationPrefix(token, 'MDI', 'Houseblock 1')

      expect(result).toEqual(locationPrefix)
    })

    it('returns null when not found', async () => {
      const notFoundError: SanitisedError = {
        message: '404 Not Found',
        name: '404 Not Found',
        stack: 'stack',
        status: 404,
      }

      locationsInsidePrisonApiClient.getAgencyGroupLocationPrefix.mockRejectedValue(notFoundError)

      const result = await locationService.getAgencyGroupLocationPrefix(token, 'MDI', 'Houseblock 1')

      expect(result).toEqual(null)
    })

    it('propagates other errors', async () => {
      locationsInsidePrisonApiClient.getAgencyGroupLocationPrefix.mockRejectedValue(new Error('some error'))

      await expect(locationService.getAgencyGroupLocationPrefix(token, 'MDI', 'Houseblock 1')).rejects.toEqual(
        new Error('some error'),
      )
    })
  })

  describe('getAgencyDetails', () => {
    it('retrieves the prison from prison-register and maps it to the agency shape', async () => {
      prisonRegisterApiClient.getPrisonById.mockResolvedValue({
        prisonId: 'MDI',
        prisonName: 'Moorland (HMP & YOI)',
        active: true,
      })

      const results = await locationService.getAgencyDetails(token, 'MDI')

      expect(prisonRegisterApiClient.getPrisonById).toHaveBeenCalledWith(token, 'MDI')
      expect(results).toEqual({ agencyId: 'MDI', description: 'Moorland (HMP & YOI)' })
    })

    it('Propagates error', async () => {
      prisonRegisterApiClient.getPrisonById.mockRejectedValue(new Error('some error'))

      await expect(locationService.getAgencyDetails(token, 'MDI')).rejects.toEqual(new Error('some error'))
    })
  })
})
