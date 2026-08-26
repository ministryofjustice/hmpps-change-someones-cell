import spaceCreatedPage from '../pages/spaceCreatedPage'

const offenderNo = 'A1234A'

context('A user get confirmation of a cell move', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubGetPrisoner', {
      prisonerNumber: offenderNo,
      firstName: 'Bob',
      lastName: 'Doe',
    })
    cy.task('stubLocation', {
      locationId: 1,
      locationData: { parentLocationId: 2, description: 'MDI-1-1', locationPrefix: 'MDI-1' },
    })

    cy.task('stubMoveToCell')
  })

  it('should page with the correct offender name', () => {
    const page = spaceCreatedPage.goTo({ offenderNo, name: 'Bob Doe' })

    page
      .backToSearchLink()
      .invoke('attr', 'href')
      .then((href: string) => {
        expect(href).to.equal('/prisoner-search')
      })
  })
})
