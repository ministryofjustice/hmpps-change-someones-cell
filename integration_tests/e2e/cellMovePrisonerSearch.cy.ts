context('Cell move prisoner search', () => {
  const toOffender = ($cell: HTMLCollectionOf<HTMLTableCellElement>) => ({
    name: $cell[1]?.textContent,
    prisonNo: $cell[2]?.textContent,
    location: $cell[3]?.textContent,
    alerts: $cell[4]?.textContent,
    cellHistoryText: $cell[5]?.textContent,
    changeCellText: $cell[6]?.textContent,
  })

  // Returned by prisonerCellAllocationService.searchInmates - prisoner-search shape, so alerts and
  // category arrive on the same record and there is no second lookup to stub.
  const prisoner1 = {
    prisonerNumber: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    cellLocation: 'UNIT-1',
    category: 'C',
    alerts: [
      { alertType: 'X', alertCode: 'XA', active: true, expired: false },
      { alertType: 'X', alertCode: 'XVL', active: true, expired: false },
    ],
  }

  const prisoner2 = {
    prisonerNumber: 'B4567CD',
    firstName: 'STEVE',
    lastName: 'SMITH',
    cellLocation: 'UNIT-2',
    category: 'C',
    alerts: [
      { alertType: 'R', alertCode: 'RSS', active: true, expired: false },
      { alertType: 'X', alertCode: 'XC', active: true, expired: false },
    ],
  }

  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })

  context('When there are no search values', () => {
    beforeEach(() => {
      cy.task('stubUserLocations')
    })

    it('should display the search box only', () => {
      cy.visit('/prisoner-search')

      cy.get('[data-test="prisoner-search-form"]').should('be.visible')
    })
  })

  context('When there are search values', () => {
    beforeEach(() => {
      cy.task('stubUserLocations')
    })

    it('should have correct data pre filled from search query', () => {
      cy.task('stubPrisonersInPrison', [prisoner1, prisoner2])
      cy.visit('/prisoner-search?keywords=SMITH')

      cy.get<HTMLTableElement>('[data-test="prisoner-search-results-table"]')
        .find('tr')
        .then($tableRows => {
          expect($tableRows.length).to.eq(3) // 2 results plus table header

          const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

          expect(offenders[1].name).to.contain('Smith, John')
          expect(offenders[1].prisonNo).to.eq('A1234BC')
          expect(offenders[1].location).to.eq('UNIT-1')
          expect(offenders[1].alerts).to.contain('Arsonist')
          expect(offenders[1].cellHistoryText).to.contain('View cell history')
          expect(offenders[1].changeCellText).to.contain('Change cell')

          expect(offenders[2].name).to.contain('Smith, Steve')
          expect(offenders[2].prisonNo).to.eq('B4567CD')
          expect(offenders[2].location).to.eq('UNIT-2')
          expect(offenders[2].cellHistoryText).to.contain('View cell history')
          expect(offenders[2].changeCellText).to.contain('Change cell')
        })
    })

    it('should have the correct link to the cell history and select cell links', () => {
      cy.task('stubPrisonersInPrison', [prisoner1])
      cy.visit('/prisoner-search?keywords=A1234BC')

      cy.get('[data-test="prisoner-cell-history-link"]').its('length').should('eq', 1)
      cy.get('[data-test="prisoner-cell-history-link"]')
        .first()
        .should('have.text', 'View cell history for John Smith')
        .should('have.attr', 'href')
        .should('include', 'http://localhost:3101/prisoner/A1234BC/location-details')

      cy.get('[data-test="prisoner-cell-search-link"]').its('length').should('eq', 1)
      cy.get('[data-test="prisoner-cell-search-link"]')
        .first()
        .should('have.text', 'John Smith - Change cell')
        .should('have.attr', 'href')
        .should('include', '/prisoner/A1234BC/cell-move/search-for-cell')
    })
  })
})

context('When the user does not have the correct cell move roles', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponents')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_SOMETHING_ELSE'] })
  })

  it('should display authorisation error', () => {
    cy.signIn({ failOnStatusCode: false })

    cy.get('h1').contains('Authorisation Error')
  })
})
