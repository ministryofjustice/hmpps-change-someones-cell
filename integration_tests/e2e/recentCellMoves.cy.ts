import moment from 'moment'

const verifyOnPage = () => cy.get('h1').contains('7 day cell move history')

context('7 day cell move history page', () => {
  const today = moment().format('YYYY-MM-DD')
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD')

  const lastSevenDays = Array.from(Array(7).keys()).map(days => moment().subtract(days, 'day').format('YYYY-MM-DD'))

  const dataSets = {
    [today]: [
      {
        bookingId: -34,
        livingUnitId: -16,
        assignmentDate: today,
        assignmentReason: 'ADM',
        agencyId: 'MDI',
        description: 'MDI-H-1-2',
        bedAssignmentHistorySequence: 2,
        movementMadeBy: 'SA',
      },
    ],
    [yesterday]: [
      {
        bookingId: -34,
        livingUnitId: -16,
        assignmentDate: yesterday,
        assignmentReason: 'ADM',
        agencyId: 'MDI',
        description: 'MDI-H-1-2',
        bedAssignmentHistorySequence: 3,
        movementMadeBy: 'SA',
      },
      {
        bookingId: -34,
        livingUnitId: -16,
        assignmentDate: yesterday,
        assignmentReason: 'ADM',
        agencyId: 'MDI',
        description: 'MDI-H-1-2',
        bedAssignmentHistorySequence: 4,
        movementMadeBy: 'SA',
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
  beforeEach(() => {
    lastSevenDays.forEach(assignmentDate =>
      cy.task('stubCellMoveHistory', {
        assignmentDate,
        agencyId: 'MDI',
        cellMoves: dataSets[assignmentDate] || [],
      }),
    )
  })
  it('show stats for the last seven days', () => {
    cy.visit('/recent-cell-moves')

    verifyOnPage()

    cy.get(`[data-qa="daily-stats-${today}"]`).then($element => {
      expect($element[0].innerText).to.eq('1')
      expect($element[0].innerHTML).contains(`/recent-cell-moves/history?date=${today}`)
    })

    cy.get(`[data-qa="daily-stats-${yesterday}"]`).then($element => {
      expect($element[0].innerText).to.eq('2')
      expect($element[0].innerHTML).contains(`/recent-cell-moves/history?date=${yesterday}`)
    })
  })
})
