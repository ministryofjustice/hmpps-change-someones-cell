import page from './page'

const confirmHomePage: () => any = () =>
  page('Change someone’s cell', {
    body: () => cy.get('.govuk-body'),
    fallbackHeaderUserName: () => cy.get('[data-qa=header-user-name]'),
    commonComponentsHeader: () => cy.get('h1').contains('Common Components Header'),
    commonComponentsFooter: () => cy.get('h1').contains('Common Components Footer'),
  })

export default {
  verifyOnPage: () => confirmHomePage(),
  goTo: () => {
    cy.visit('/')
    return confirmHomePage()
  },
}
