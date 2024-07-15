import moment from 'moment'
import NonAssociationsPage from '../pages/nonAssociationsPage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisonerFullDetails = require('../mockApis/responses/prisonerFullDetails.json')

const prisonerNumber = 'A12345'

context('A user can view non associations', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber,
      prisonId: 'MDI',
      cellLocation: '1-1-3',
    })
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber: 'ABC124',
      prisonId: 'MDI',
      cellLocation: '2-1-2',
    })
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber: 'ABC125',
      prisonId: 'MDI',
      cellLocation: '2-1-3',
    })
    cy.task('stubGetPrisonerNonAssociations', {
      prisonerNumber: 'A12345',
      firstName: 'John',
      lastName: 'Smith',
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      cellLocation: '1-1-3',
      openCount: 2,
      closedCount: 1,
      nonAssociations: [
        {
          reason: 'RIV',
          reasonDescription: 'Rival gang',
          role: 'VIC',
          roleDescription: 'Victim',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          whenCreated: moment().subtract(10, 'days'),
          comment: 'Test comment 1',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC124',
            firstName: 'Joseph',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-2',
          },
        },
        {
          reason: 'RIV',
          reasonDescription: 'Rival gang',
          role: 'RIV',
          roleDescription: 'Rival gang',
          restrictionType: 'WING',
          restrictionTypeDescription: 'Do Not Locate on Same Wing',
          whenCreated: '2019-12-01T13:34:00',
          comment: 'Test comment 2',
          otherPrisonerDetails: {
            prisonerNumber: 'ABC125',
            firstName: 'Jim',
            lastName: 'Bloggs',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '2-1-3',
          },
        },
      ],
    })
  })

  it('Shows the correct data for non-associations', () => {
    cy.visit(`/prisoner/${prisonerNumber}/cell-move/non-associations`)
    const nonAssociationsPage = NonAssociationsPage.verifyOnPage()
    nonAssociationsPage.message().contains('You must check any local processes for non-association details.')
    nonAssociationsPage.backLink().contains('Return to search for a cell')
    cy.get(`[data-test="non-association-summary-ABC125"]`).find('dt').its('length').should('eq', 9)
    cy.get(`[data-test="non-association-summary-ABC125"]`)
      .find('dt')
      .then($headings => {
        expect($headings.get(0).innerText).to.contain('Name')
        expect($headings.get(1).innerText).to.contain('Prison number')
        expect($headings.get(2).innerText).to.contain('Location')
        expect($headings.get(3).innerText).to.contain('Reason')
        expect($headings.get(4).innerText).to.contain('Type')
        expect($headings.get(5).innerText).to.contain('John Smith is')
        expect($headings.get(6).innerText).to.contain('Jim Bloggs is')
        expect($headings.get(7).innerText).to.contain('Comment')
        expect($headings.get(8).innerText).to.contain('Effective date')
      })

    cy.get(`[data-test="non-association-summary-ABC125"]`).find('dd').its('length').should('eq', 9)
    cy.get(`[data-test="non-association-summary-ABC125"]`)
      .find('dd')
      .then($summaryValues => {
        expect($summaryValues.get(0).innerText).to.contain('Bloggs, Jim')
        expect($summaryValues.get(1).innerText).to.contain('ABC125')
        expect($summaryValues.get(2).innerText).to.contain('2-1-3')
        expect($summaryValues.get(3).innerText).to.contain('Rival gang')
        expect($summaryValues.get(4).innerText).to.contain('Do Not Locate on Same Wing')
        expect($summaryValues.get(5).innerText).to.contain('Rival gang')
        expect($summaryValues.get(6).innerText).to.contain('Perpetrator')
        expect($summaryValues.get(7).innerText).to.contain('Test comment 2')
        expect($summaryValues.get(8).innerText).to.contain('1 December 2019')
      })

    cy.get(`[data-test="non-association-summary-ABC124"]`).find('dt').its('length').should('eq', 9)
    cy.get(`[data-test="non-association-summary-ABC124"]`)
      .find('dt')
      .then($headings => {
        expect($headings.get(0).innerText).to.contain('Name')
        expect($headings.get(1).innerText).to.contain('Prison number')
        expect($headings.get(2).innerText).to.contain('Location')
        expect($headings.get(3).innerText).to.contain('Reason')
        expect($headings.get(4).innerText).to.contain('Type')
        expect($headings.get(5).innerText).to.contain('John Smith is')
        expect($headings.get(6).innerText).to.contain('Joseph Bloggs is')
        expect($headings.get(7).innerText).to.contain('Comment')
        expect($headings.get(8).innerText).to.contain('Effective date')
      })

    cy.get(`[data-test="non-association-summary-ABC124"]`).find('dd').its('length').should('eq', 9)
    cy.get(`[data-test="non-association-summary-ABC124"]`)
      .find('dd')
      .then($summaryValues => {
        expect($summaryValues.get(0).innerText).to.contain('Bloggs, Joseph')
        expect($summaryValues.get(1).innerText).to.contain('ABC124')
        expect($summaryValues.get(2).innerText).to.contain('2-1-2')
        expect($summaryValues.get(3).innerText).to.contain('Rival gang')
        expect($summaryValues.get(4).innerText).to.contain('Do Not Locate on Same Wing')
        expect($summaryValues.get(5).innerText).to.contain('Victim')
        expect($summaryValues.get(6).innerText).to.contain('Perpetrator')
        expect($summaryValues.get(7).innerText).to.contain('Test comment 1')
        expect($summaryValues.get(8).innerText).to.contain(moment().subtract(10, 'days').format('D MMMM YYYY'))
      })
  })
})
