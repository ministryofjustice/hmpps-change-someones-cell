context('Cell move view residential location', () => {
  const toOffender = $cell => ({
    name: $cell[1]?.textContent,
    prisonNo: $cell[2]?.textContent,
    location: $cell[3]?.textContent,
    alerts: $cell[4]?.textContent,
    cellHistoryText: $cell[5]?.textContent,
    changeCellText: $cell[6]?.textContent,
  })

  const inmate1 = {
    bookingId: 1,
    offenderNo: 'A1234BC',
    firstName: 'JOHN',
    lastName: 'SMITH',
    dateOfBirth: '1990-10-12',
    age: 29,
    agencyId: 'MDI',
    assignedLivingUnitId: 1,
    assignedLivingUnitDesc: 'UNIT-1',
    alertsDetails: ['XA', 'XVL'],
  }
  const inmate2 = {
    bookingId: 2,
    offenderNo: 'B4567CD',
    firstName: 'STEVE',
    lastName: 'SMITH',
    dateOfBirth: '1989-11-12',
    age: 30,
    agencyId: 'MDI',
    assignedLivingUnitId: 2,
    assignedLivingUnitDesc: 'UNIT-2',
    alertsDetails: ['RSS', 'XC'],
  }

  // prisoner1 and prisoner2 are data returned by prisonerDetailsService.getPrisoners
  const prisoner1 = {
    prisonerNumber: 'A1234BC',
    alerts: [
      {
        alertType: 'X',
        alertCode: 'XA',
        active: true,
        expired: false,
      },
      {
        alertType: 'X',
        alertCode: 'XVL',
        active: true,
        expired: false,
      },
    ],
  }
  const prisoner2 = {
    prisonerNumber: 'B4567CD',
    alerts: [
      {
        alertType: 'X',
        alertCode: 'RSS',
        active: true,
        expired: false,
      },
      {
        alertType: 'X',
        alertCode: 'XC',
        active: true,
        expired: false,
      },
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
      cy.task('stubGroups', { id: 'MDI' })
    })

    it('should display the search box with the expected data only', () => {
      cy.visit('/view-residential-location')

      cy.get('[data-test="prisoner-search-form"]')
        .should('be.visible')
        .within(() => {
          cy.get('[data-test="prisoner-search-location"]')
            .children('option')
            .then(options => {
              const actual = options.toArray().map(o => o.value)
              expect(actual).to.deep.eq(['SELECT', '1', '2', '3'])
            })
        })
      cy.get('[data-test="prisoner-search-results-table"]').should('not.exist')
    })
  })

  context('When there are search values submitted', () => {
    beforeEach(() => {
      cy.task('stubGroups', { id: 'MDI' })
      cy.task('stubActivePrisons')
    })

    it('should have correct data pre filled from search query', () => {
      cy.task('stubInmates', {
        locationId: 'MDI-1',
        count: 2,
        data: [inmate1, inmate2],
      })
      cy.task('stubGetPrisoners', [prisoner1, prisoner2])

      cy.visit('/view-residential-location?location=1')

      cy.get('[data-test="prisoner-search-results-table"]').find('tr').its('length').should('eq', 3)
      cy.get('[data-test="prisoner-search-results-table"]')
        .find('tr')
        .then($tableRows => {
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
      cy.task('stubInmates', {
        locationId: 'MDI-2',
        count: 1,
        data: [inmate1],
      })

      cy.task('stubGetPrisoners', [prisoner1, prisoner2])

      cy.visit('/view-residential-location?location=2')

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
