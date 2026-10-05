import { Contracts } from 'applicationinsights'
import { addUserDataToRequests } from './azureAppInsights'

describe('azure app insights telemetry metadata', () => {
  it('adds user identity fields to request telemetry', () => {
    const envelope = {
      data: {
        baseType: Contracts.TelemetryTypeString.Request,
        baseData: {
          properties: { existing: 'value' },
        },
      },
    } as any

    const contextObjects = {
      'http.ServerRequest': {
        res: {
          locals: {
            user: {
              username: 'user-one',
              userId: '12345',
              userUuid: '11111111-1111-1111-1111-111111111111',
              activeCaseLoadId: 'MDI',
            },
          },
        },
      },
    }

    const result = addUserDataToRequests(envelope, contextObjects)

    expect(result).toBe(true)
    expect(envelope.data.baseData.properties).toEqual({
      username: 'user-one',
      userId: '12345',
      userUuid: '11111111-1111-1111-1111-111111111111',
      activeCaseLoadId: 'MDI',
      existing: 'value',
    })
  })
})
