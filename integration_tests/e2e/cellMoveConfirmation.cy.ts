import cellConfirmationPage from '../pages/cellMoveConfirmationPage'
import homePage from '../pages/homePage'

const offenderNo = 'A1234A'
const cellId = 1

context('A user get confirmation of a cell move', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubBookingDetails', {
      firstName: 'Bob',
      lastName: 'Doe',
      offenderNo,
      bookingId: 1234,
    })
    cy.task('stubLocation', {
      locationId: 1,
      locationData: { parentLocationId: 2, description: 'MDI-1-1', locationPrefix: 'MDI-1' },
    })
    cy.task('stubMoveToCell')
  })

  it('should page with the correct offender name and cell description', () => {
    const page = cellConfirmationPage.goTo({ offenderNo, cellId, cellDescription: 'MDI-1-1', name: 'Bob Doe' })

    cy.title().should('eq', `Change Someone's Cell - The prisoner’s cell has been changed`)

    cy.get("[data-test='exit-survey-link']")
      .invoke('attr', 'href')
      .then(href => {
        expect(href).to.equal('https://eu.surveymonkey.com/r/3JHPDDD')
      })

    page.backToStart().click()

    homePage.verifyOnPage()
  })
})
