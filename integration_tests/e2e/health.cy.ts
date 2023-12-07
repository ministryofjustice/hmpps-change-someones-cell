context('Health page reports health correctly', () => {
  context('when all dependencies are healthy', () => {
    it('is visible and UP', () => {
      cy.task('reset')
      cy.task('stubHealthAllHealthy')
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.status).to.equal('UP')
      })
    })
  })

  context('when some dependencies are unhealthy', () => {
    it('is visible and UP', () => {
      cy.task('reset')
      cy.task('stubHealthAllHealthy')
      cy.task('stubAuthHealth', 500)
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components).to.deep.equal({
          hmppsAuth: {
            status: 'DOWN',
            details: {
              timeout: 1500,
              code: 'ECONNABORTED',
              errno: 'ETIMEDOUT',
              retries: 2,
            },
          },
          manageUsersApi: {
            status: 'UP',
            details: 'UP',
          },
          tokenVerification: {
            status: 'UP',
            details: 'UP',
          },
        })
        expect(response.body.status).to.equal('DOWN')
      })
    })
  })
})
