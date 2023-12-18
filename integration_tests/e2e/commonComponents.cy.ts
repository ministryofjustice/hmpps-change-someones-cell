import HomePage from '../pages/homePage'

context('Common component functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubUserLocations')
    cy.task('stubLocationConfig', { agencyId: 'MDI', response: { enabled: false } })
    cy.task('stubComponents')
  })

  it('Sign in takes user to sign in page', () => {
    cy.task('stubSignIn', {})
    cy.signIn()
    const page = HomePage.goTo()
    page.commonComponentsHeader().should('exist')
    page.commonComponentsFooter().should('exist')
  })
})
