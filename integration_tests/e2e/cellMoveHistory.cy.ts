const toCellMove = $cell => ({
  name: $cell[0]?.textContent,
  movedFrom: $cell[1]?.textContent,
  movedTo: $cell[2]?.textContent,
  movedBy: $cell[3]?.textContent,
  reason: $cell[4]?.textContent,
  time: $cell[5]?.textContent,
})

const offenderCellHistory = {
  history: {
    content: [
      {
        agencyId: 'MDI',
        assignmentDate: '2020-05-01',
        assignmentDateTime: '2020-05-01T12:48:33.375',
        assignmentReason: 'ADM',
        bookingId: 123,
        description: 'MDI-1-02',
        livingUnitId: 1,
        movementMadeBy: 'STAFF_1',
      },
      {
        agencyId: 'MDI',
        assignmentDate: '2020-03-01',
        assignmentDateTime: '2020-03-01T12:48:33.375',
        assignmentEndDate: '2020-04-01',
        assignmentEndDateTime: '2020-04-01T12:48:33.375',
        assignmentReason: 'ADM',
        bookingId: 123,
        description: 'MDI-RECP',
        livingUnitId: 2,
        movementMadeBy: 'STAFF_2',
      },
      {
        agencyId: 'MDI',
        assignmentDate: '2020-04-01',
        assignmentDateTime: '2020-04-01T12:48:33.375',
        assignmentEndDate: '2020-05-01',
        assignmentEndDateTime: '2020-05-01T12:48:33.375',
        assignmentReason: 'ADM',
        bookingId: 123,
        description: 'MDI-1-03',
        livingUnitId: 3,
        movementMadeBy: 'STAFF_1',
      },
    ],
  },
}

context('Cell move history', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubCellMoveHistory', {
      assignmentDate: '2021-04-30',
      agencyId: 'MDI',
      cellMoves: [
        {
          bookingId: -34,
          livingUnitId: -16,
          assignmentDate: '2021-04-30',
          assignmentDateTime: `'2021-04-30T11:00:00`,
          assignmentReason: 'ADM',
          agencyId: 'MDI',
          description: 'MDI-H-1-2',
          bedAssignmentHistorySequence: 3,
          movementMadeBy: 'SA',
          offenderNo: 'A12345',
        },
      ],
    })
    cy.task('stubGroups', { id: 'MDI' })
    cy.task('stubCellMoveTypes', [
      {
        domain: 'CHG_HOUS_RSN',
        code: 'ADM',
        description: 'Administrative',
        activeFlag: 'N',
        listSeq: 1,
        systemDataFlag: 'N',
        subCodes: [],
      },
      {
        domain: 'CHG_HOUS_RSN',
        code: 'BEH',
        description: 'Behaviour',
        activeFlag: 'N',
        listSeq: 2,
        systemDataFlag: 'N',
        subCodes: [],
      },
    ])
    cy.task('stubGetPrisoners', [{ prisonerNumber: 'A12345', firstName: 'BOB', lastName: 'DOE', bookingId: 1234 }])
    cy.task('stubStaff', { staffId: 'SA', firstName: 'Pow', lastName: 'Now' })
    cy.task('stubOffenderCellHistory', offenderCellHistory)
  })

  it('should show default message for no cell moves found', () => {
    cy.visit('/recent-cell-moves/history?date=2021-04-30&reason=D')

    cy.get('[data-test="no-cell-moves"]').should('be.visible')
    cy.get('[data-test="cell-history-table"]').should('not.exist')
  })

  it('should display cell move history for date', () => {
    cy.visit('/recent-cell-moves/history?date=2021-04-30')

    cy.get('[data-test="cell-history-table"]')
      .find('tr')
      .then($tableRows => {
        const cellMoves = Array.from($tableRows).map($row => toCellMove($row.cells))

        expect(cellMoves[1].name).to.contain('Doe, Bob')
        expect(cellMoves[1].movedFrom).to.eq('No cell allocated')
        expect(cellMoves[1].movedTo).to.eq('H-1-2')
        expect(cellMoves[1].movedBy).to.contain('')
        expect(cellMoves[1].reason).to.contain('Administrative')
        expect(cellMoves[1].time).to.contain('11:00')
      })
  })
})
