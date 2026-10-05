Cypress.Commands.add('verifyAuditEvents', (events: object[]) => {
  return cy.task('getSentAuditEvents', events.length).should('deep.equal', events)
})

Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task<string>('getSignInUrl').then(url => cy.visit(url, options))
})
