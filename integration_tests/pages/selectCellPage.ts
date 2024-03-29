import page from './page'

const selectCellPage: () => any = () =>
  page('Select an available cell', {
    message: () => cy.get("[data-test='message']"),
    backLink: () => cy.get('a.govuk-link'),
    cellResults: () => cy.get('[data-test="cell-results-table"]'),
    locationTableHeader: () => cy.get('[data-test="location-table-header"]').find('button'),
    nonAssociationWarning: () => cy.get('#non-association-warning'),
    selectCswapText: () => cy.get('[data-test="select-cswap-text"]'),
    selectCswapLink: () => cy.get('[data-test="select-cswap-link"]'),
    noResultsMessage: () => cy.get('[data-test="no-results-message"]'),
    numberOfNonAssociations: () => cy.get("[data-test='number-of-non-associations']"),
  })

export default {
  verifyOnPage: selectCellPage,
  goTo: (offenderNo: string, location?: string) => {
    if (location) {
      cy.visit(`/prisoner/${offenderNo}/cell-move/select-cell?location=${location}`)
    } else {
      cy.visit(`/prisoner/${offenderNo}/cell-move/select-cell`)
    }
    return selectCellPage()
  },
}
