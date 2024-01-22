import { Readable } from 'stream'
import { PrisonApiClient } from '../data'
import PrisonerDetailsService from './prisonerDetailsService'

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
})
