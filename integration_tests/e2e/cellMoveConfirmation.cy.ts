import cellConfirmationPage from '../pages/cellMoveConfirmationPage'
import homePage from '../pages/homePage'

const offenderNo = 'A1234A'
const cellId = 'MDI-1-1-1'

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
      prisonId: 'MDI',
      parentId: 'uuid',
      key: 'MDI-1-1-1',
      pathHierarchy: '1-1-1',
      capacity: {
        maxCapacity: 2,
        workingCapacity: 2,
      },
    })
    cy.task('stubMoveToCell')
  })

  it('should page with the correct offender name and cell description', () => {
    const page = cellConfirmationPage.goTo({ offenderNo, cellId, cellDescription: '1-1-1', name: 'Bob Doe' })

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
