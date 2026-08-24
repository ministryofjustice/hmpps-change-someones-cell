import receptionConfirmMovePage from '../pages/receptionConfirmMovePage'
import offenderFullDetails from '../mockApis/responses/offenderFullDetails.json'
import offenderBasicDetails from '../mockApis/responses/offenderBasicDetails.json'
import prisonerFullDetails from '../mockApis/responses/prisonerFullDetails.json'

const offenderNo = 'G3878UK'

before(() => {
  cy.clearCookies()
  cy.task('reset')
  cy.task('stubComponentsFail')
  cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
  cy.signIn()
  cy.task('stubOffenderFullDetails', {
    ...offenderFullDetails,
    alerts: [
      {
        alertId: 6,
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XGANG',
        alertCodeDescription: 'Gang Member',
        dateCreated: '2023-10-10',
        expired: false,
        active: true,
        addedByFirstName: 'DAVID',
        addedByLastName: 'MICHAELSON',
      },
      {
        alertId: 5,
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XA',
        alertCodeDescription: 'Arsonist',
        dateCreated: '2023-10-10',
        expired: false,
        active: true,
        addedByFirstName: 'DAVID',
        addedByLastName: 'MICHAELSON',
      },
      {
        alertId: 7,
        alertType: 'X',
        alertTypeDescription: 'Security',
        alertCode: 'XR',
        alertCodeDescription: 'Racist',
        dateCreated: '2023-10-10',
        expired: false,
        active: true,
        addedByFirstName: 'DAVID',
        addedByLastName: 'MICHAELSON',
      },
      {
        alertId: 2,
        alertType: 'H',
        alertTypeDescription: 'Self Harm',
        alertCode: 'HA1',
        alertCodeDescription: 'ACCT Post Closure (HMPS)',
        dateCreated: '2016-12-23',
        dateExpires: '2017-01-01',
        modifiedDateTime: '2017-05-09T21:57:05.254213',
        expired: false,
        active: true,
        addedByFirstName: 'EASTZO',
        addedByLastName: 'CLIFTOLINE',
        expiredByFirstName: 'ADMIN&ONB',
        expiredByLastName: 'CNOMIS',
      },
    ],
  })
  cy.task('stubOffenderBasicDetails', offenderBasicDetails)
  cy.task('stubGetPrisoner', prisonerFullDetails)
  // The real MDI-RECP shape: workingCapacity 0 must fall back to maxCapacity.
  cy.task('stubLocation', {
    prisonId: 'MDI',
    key: 'MDI-RECP',
    pathHierarchy: 'RECP',
    capacity: { maxCapacity: 99, workingCapacity: 0 },
  })
  cy.task('stubAttributeSearch', [])
  cy.task('stubCellMoveReasons', [
    { code: 'RAIM', description: 'Reception and induction moves', active: true },
    { code: 'SS', description: 'Someone’s safety', active: true },
    { code: 'SPP', description: 'Security of the prison or other people', active: true },
    { code: 'HOSP', description: 'Healthcare', active: true },
    { code: 'PCM', description: 'Maintenance of the prison or cell', active: true },
    { code: 'GM', description: 'General moves', active: true },
  ])
})

describe('Reception confirm move page ', () => {
  it('should load correct data to page', () => {
    const page = receptionConfirmMovePage.goTo(offenderNo)

    cy.title().should('eq', `Change Someone's Cell - Confirm reception move`)
    page.govInsetTextMessage().should('contain', 'You must have checked any local processes for non-associations.')
    page.cancelLink()
  })
})

describe('Reception full journey', () => {
  it('should redirect to reception full page', () => {
    // One occupant against a capacity of one: reception is full.
    cy.task('stubLocation', {
      prisonId: 'MDI',
      key: 'MDI-RECP',
      pathHierarchy: 'RECP',
      capacity: { maxCapacity: 1, workingCapacity: 0 },
    })
    cy.task('stubAttributeSearch', [
      { prisonerNumber: 'A1111AA', firstName: 'Full', lastName: 'House', prisonId: 'MDI', cellLocation: 'RECP' },
    ])

    const page = receptionConfirmMovePage.goTo(offenderNo)
    page.form().selectReceptionReason().click()
    page.form().moveReason().type('Urgent medical appointment')
    page.form().submitButton().click()

    cy.title().should('eq', `Change Someone's Cell - No space available in reception`)
    cy.get('.govuk-back-link')
      .invoke('attr', 'href')
      .then(href => {
        expect(href).to.include('/prisoner/G3878UK/reception-move/confirm-reception-move')
      })
    cy.get('[data-test="location-details-link"]')
      .invoke('attr', 'href')
      .then(href => {
        expect(href).to.equal('http://localhost:3101/prisoner/G3878UK/location-details')
      })
  })

  it('A user is presented with locked message when 423 error', () => {
    // The real MDI-RECP shape: workingCapacity 0 must fall back to maxCapacity.
    cy.task('stubLocation', {
      prisonId: 'MDI',
      key: 'MDI-RECP',
      pathHierarchy: 'RECP',
      capacity: { maxCapacity: 99, workingCapacity: 0 },
    })
    cy.task('stubAttributeSearch', [])
    cy.task('stubMoveToCell', 423)

    const page = receptionConfirmMovePage.goTo(offenderNo)
    page.form().selectReceptionReason().click()
    page.form().moveReason().type('Urgent medical appointment')
    page.form().submitButton().click()

    receptionConfirmMovePage
      .verifyOnPage()
      .errorSummaryList()
      .find('li')
      .then(($errors: JQuery<HTMLElement>) => {
        expect($errors.get(0).innerText).to.contain(
          'This reception move cannot be carried out because a user currently has this prisoner open in P-Nomis, please try later',
        )
      })
  })
})
