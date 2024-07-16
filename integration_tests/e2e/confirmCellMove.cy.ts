import ConfirmCellMovePage from '../pages/confirmCellMovePage'

import { assertHasRequestCount } from '../assertions'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderBasicDetails = require('../mockApis/responses/offenderBasicDetails.json')

const offenderNo = 'A12345'
const bookingId = 1234

context('A user can confirm the cell move', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubGetPrisoner', {
      firstName: 'Bob',
      lastName: 'Doe',
      prisonerNumber: offenderNo,
      bookingId,
      prisonId: 'MDI',
      cellLocation: '1-1-1',
    })
    cy.task('stubLocation', {
      prisonId: 'MDI',
      parentId: 'uuid',
      key: 'MDI-1-1-1',
      pathHierarchy: '1-1-1',
      capacity: {
        maxCapacity: 2,
        workingCapacity: 2,
      },
    })
    cy.task('stubMoveToCell')
    cy.task('stubMoveToCellSwap')
    cy.task('stubCellMoveTypes', [
      {
        code: 'ADM',
        activeFlag: 'Y',
        description: 'Administrative',
      },
      {
        code: 'BEH',
        activeFlag: 'Y',
        description: 'Behaviour',
      },
    ])
    cy.task('stubOffenderBasicDetails', offenderBasicDetails)
  })

  it('should display correct location and warning text', () => {
    const page = ConfirmCellMovePage.goTo('A12345', 'MDI-1-1-1', 'Bob Doe', '1-1-1')

    page.warning().contains('You must have checked any local processes for non-associations.')
  })

  it('should make a call to update an offenders cell', () => {
    const page = ConfirmCellMovePage.goTo(offenderNo, 'MDI-1-1-1', 'Bob Doe', '1-1-1')
    const comment = 'Hello world'
    page.form().reason().click()
    page.form().comment().type(comment)
    page.form().submitButton().click()

    cy.task('verifyMoveToCell', {
      bookingId,
      offenderNo,
      cellMoveReasonCode: 'ADM',
      internalLocationDescriptionDestination: 'MDI-1-1-1',
      commentText: comment,
    }).then(assertHasRequestCount(1))

    cy.location('pathname').should('eq', `/prisoner/${offenderNo}/cell-move/confirmation`)
  })

  it('should navigate back to search for cell', () => {
    const page = ConfirmCellMovePage.goTo('A12345', 'MDI-1-1-1', 'Bob Doe', '1-1-1')

    page.backLink().contains('Cancel')
    page.backLink().click()

    cy.location('pathname').should('eq', '/prisoner/A12345/cell-move/search-for-cell')
  })

  it('should have a back button leading to search for cell', () => {
    ConfirmCellMovePage.goTo('A12345', 'MDI-1-1-1', 'Bob Doe', '1-1-1')

    cy.contains('Back').click()

    cy.location('pathname').should('eq', '/prisoner/A12345/cell-move/search-for-cell')
  })

  it('should not mention c-swap or show form inputs', () => {
    const page = ConfirmCellMovePage.goTo('A12345', 'C-SWAP', 'Bob Doe', 'swap')

    page.warning().should('not.exist')

    page.form().reason().should('not.exist')

    page.form().comment().should('not.exist')

    page.form().submitButton().click()

    cy.task('verifyMoveToCellSwap', { bookingId: 1234 }).then(assertHasRequestCount(1))

    cy.location('pathname').should('eq', '/prisoner/A12345/cell-move/space-created')
  })

  it('A user is presented with locked message when 423 error', () => {
    cy.task('stubMoveToCell', 423)

    const page = ConfirmCellMovePage.goTo(offenderNo, 'MDI-1-1-1', 'Bob Doe', '1-1-1')
    const comment = 'Hello world'
    page.form().reason().click()
    page.form().comment().type(comment)
    page.form().submitButton().click()

    cy.task('verifyMoveToCell', {
      bookingId,
      offenderNo,
      cellMoveReasonCode: 'ADM',
      internalLocationDescriptionDestination: 'MDI-1-1-1',
      commentText: comment,
    }).then(assertHasRequestCount(1))

    ConfirmCellMovePage.verifyOnPage('Bob Doe', '1-1-1')
      .errorSummaryList()
      .find('li')
      .then($errors => {
        expect($errors.get(0).innerText).to.contain(
          'This cell move cannot be carried out because a user currently has this prisoner open in P-Nomis, please try later',
        )
      })
  })
})
