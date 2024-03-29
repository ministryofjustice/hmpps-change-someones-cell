import CellSharingRiskAssessmentPage from '../pages/cellSharingRiskAssessmentDetailsPage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderFullDetails = require('../mockApis/responses/offenderFullDetails.json')

const offenderNo = 'A12345'

context('A user can view non associations', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubOffenderFullDetails', offenderFullDetails)
    cy.task('stubCsraAssessments', {
      offenderNumbers: [offenderNo],
      assessments: [
        {
          bookingId: 1234,
          offenderNo,
          classificationCode: 'STANDARD',
          classification: 'Standard',
          assessmentCode: 'CSR',
          assessmentDescription: 'CSR Rating',
          cellSharingAlertFlag: true,
          assessmentDate: '2020-08-17',
          nextReviewDate: '2020-08-19',
          approvalDate: '2020-08-18',
          assessmentAgencyId: 'MDI',
          assessmentStatus: 'A',
          assessmentSeq: 1,
          assessmentComment: 'Some comment',
          assessorId: 1,
          assessorUser: 'TEST_USER',
        },
      ],
    })
    cy.task('stubAgencyDetails', { agencyId: 'MDI', details: { description: 'HMP Moorland' } })
  })

  it('Shows the correct data for non-associations', () => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/cell-sharing-risk-assessment-details`)
    const cellSharingRiskAssessmentDetailsPage = CellSharingRiskAssessmentPage.verifyOnPage()
    cy.get('.govuk-summary-list--no-border').find('dt').its('length').should('eq', 6)
    cy.get('.govuk-summary-list--no-border')
      .find('dt')
      .then($headings => {
        expect($headings.get(0).innerText).to.contain('Cell location')
        expect($headings.get(1).innerText).to.contain('Name')
        expect($headings.get(2).innerText).to.contain('CSRA level')
        expect($headings.get(3).innerText).to.contain('Comments')
        expect($headings.get(4).innerText).to.contain('Assessment date')
        expect($headings.get(5).innerText).to.contain('Assessment location')
      })

    cy.get('.govuk-summary-list--no-border').find('dd').its('length').should('eq', 6)
    cy.get('.govuk-summary-list--no-border')
      .find('dd')
      .then($summaryValues => {
        expect($summaryValues.get(0).innerText).to.contain('HMP Moorland')
        expect($summaryValues.get(1).innerText).to.contain('Smith, John')
        expect($summaryValues.get(2).innerText).to.contain('Standard')
        expect($summaryValues.get(3).innerText).to.contain('Some comment')
        expect($summaryValues.get(4).innerText).to.contain('17 August 2020')
        expect($summaryValues.get(5).innerText).to.contain('HMP Moorland')
      })
    cellSharingRiskAssessmentDetailsPage.backLink().contains('Return to search for a cell')
  })
})
