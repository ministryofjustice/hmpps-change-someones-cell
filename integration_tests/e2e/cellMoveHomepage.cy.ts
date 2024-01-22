context('Cell move homepage', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
  })

  context('when logged in', () => {
    beforeEach(() => {
      cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
      cy.signIn()
    })

    it('should show non role specific tasks', () => {
      cy.visit('/')

      cy.get('[data-test="search-for-prisoner"]').should('exist')
      cy.get('[data-test="view-residential-location"]').should('exist')
      cy.get('[data-test="create-space"]').should('exist')
      cy.get('[data-test="view-history"]').should('contain', 'Moorland')
      cy.get('[data-test="no-cell-allocated"]').should('exist')
    })

    it('There is a valid DPS homepage breadcrumb', () => {
      cy.visit('/')

      cy.get('[data-test=dps-link]')
        .should('contain', 'Digital Prison Services')
        .should('have.attr', 'href')
        .then(href => {
          expect(href).to.equal('http://localhost:3100')
        })
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
