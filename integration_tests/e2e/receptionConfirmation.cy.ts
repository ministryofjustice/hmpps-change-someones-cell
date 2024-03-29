import receptionConfirmationPage from '../pages/receptionConfirmationPage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderFullDetails = require('../mockApis/responses/offenderFullDetails.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderBasicDetails = require('../mockApis/responses/offenderBasicDetails.json')

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
})

describe('Reception move confirmation page ', () => {
  it('should load correct data to page', () => {
    const page = receptionConfirmationPage.goTo(offenderNo)

    cy.title().should('eq', `Change Someone's Cell - This person has been moved to reception`)
    page.surveyLink()
    page.finishLink()
  })
})
