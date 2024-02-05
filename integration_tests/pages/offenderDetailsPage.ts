import page from './page'

const offenderDetailsPage: () => any = () =>
  page('Prisoner details', {
    backLink: () => cy.get("[data-test='back-link']"),
    profileLink: () => cy.get("[data-test='profile-link']"),
  })

export default {
  verifyOnPage: offenderDetailsPage,
  goTo: offenderNo => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/prisoner-details`)
    return offenderDetailsPage()
  },
}
