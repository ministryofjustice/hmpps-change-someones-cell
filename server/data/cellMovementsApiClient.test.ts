import nock from 'nock'
import config from '../config'
import CellMovementsApiClient, { CellMovement } from './cellMovementsApiClient'

const accessToken = 'token-1'

describe('cellMovementsApiClient', () => {
  let fakeApi: nock.Scope
  let client: CellMovementsApiClient

  beforeEach(() => {
    fakeApi = nock(config.apis.cellMovementsApi.url)
    client = new CellMovementsApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  const movement: CellMovement = {
    id: 'e19a2b16-6b7b-4a3e-9f1a-2d8e5c4f3a21',
    movementType: 'CELL_MOVE',
    prisonerNumber: 'A1234BC',
    toLocationKey: 'MDI-1-1-015',
    reasonCode: 'ADM',
    occurredAt: '2026-08-19T10:00:00',
    recordedBy: 'A_USER',
    status: 'COMPLETED',
  }

  describe('moveToCell', () => {
    it('posts the movement with no booking id', async () => {
      fakeApi
        .post('/cell-movements', {
          prisonerNumber: 'A1234BC',
          toLocationKey: 'MDI-1-1-015',
          reasonCode: 'ADM',
          commentText: 'Some comment',
        })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(201, movement)

      const output = await client.moveToCell(accessToken, 'A1234BC', 'MDI-1-1-015', 'ADM', 'Some comment')
      expect(output).toEqual(movement)
    })
  })

  describe('moveToCellSwap', () => {
    it('posts only the prisoner number', async () => {
      fakeApi
        .post('/cell-movements/cell-swap', { prisonerNumber: 'A1234BC' })
        .matchHeader('authorization', `Bearer ${accessToken}`)
        .reply(201, { ...movement, movementType: 'CELL_SWAP', toLocationKey: 'MDI-CSWAP' })

      const output = await client.moveToCellSwap(accessToken, 'A1234BC')
      expect(output.movementType).toEqual('CELL_SWAP')
    })
  })
})
