import { TelemetryClient } from 'applicationinsights'
import MetricsService from './metricsService'
import MetricsEvent from '../data/metricsEvent'

jest.mock('applicationinsights')

describe('Metrics Service', () => {
  const telemetryClient = new TelemetryClient()
  const metricsService = new MetricsService(telemetryClient)

  it('trackEvent', () => {
    const event = new MetricsEvent('event-name', 'MDI')
    metricsService.trackEvent(event)
    expect(telemetryClient.trackEvent).toHaveBeenCalledWith(event)
  })
})
