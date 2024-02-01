import cellNotAvailablePage from '../pages/cellNotAvailablePage'

const offenderNo = 'A12345'

context('A user is presented with a cell no longer available error page', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })

  it('should show the correct message', () => {
    const page = cellNotAvailablePage.goTo({ offenderNo, cellDescription: 'MDI-1-1' })

    page.body().contains('This cell is no longer available. You must select another cell.')
  })

  it('should set the correct url on the select another cell button', () => {
    const page = cellNotAvailablePage.goTo({ offenderNo, cellDescription: 'MDI-1-1' })

    page.selectAnotherCellLink().should('be.visible')
    page
      .selectAnotherCellLink()
      .invoke('attr', 'href')
      .then(href => {
        expect(href).to.equal('/prisoner/A12345/cell-move/select-cell')
      })
  })
})
