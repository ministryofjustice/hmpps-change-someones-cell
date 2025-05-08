export default class MetricsEvent {
  properties: Record<string, string | number>

  name: string

  constructor(eventName: string, agencyId: string) {
    this.name = eventName
    this.properties = {
      prisonCode: agencyId,
    }
  }

  addProperties(properties: Record<string, string | number>) {
    this.properties = { ...this.properties, ...properties }
    return this
  }

  static CELL_MOVE_EVENT(agencyId: string, cellType: string) {
    const event = new MetricsEvent('Cell move event', agencyId)
    return event.addProperties({
      cellType,
    })
  }

  static CANCELLED_OR_CONSIDER_RISKS_EVENT(
    agencyId: string,
    offenderAlertCodes: string,
    alertCodesAssociatedWithOccupants: string,
  ) {
    const event = new MetricsEvent('Cancelled or consider risks event', agencyId)
    return event.addProperties({
      offenderAlertCodes,
      cellOccupantsAlertCodes: alertCodesAssociatedWithOccupants,
    })
  }
}
