import SelectCellPage from '../pages/selectCellPage'
import ConsiderRisksPage from '../pages/considerRisksPage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisonerFullDetails = require('../mockApis/responses/prisonerFullDetails.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderFullDetails = require('../mockApis/responses/offenderFullDetails.json')

const offenderNo = 'A12345'

context('A user can select a cell', () => {
  const assertRow = (
    rowIndex,
    columns,
    { location, cellType, capacity, spaces, occupier, csra, relevantAlerts, selectCell },
  ) => {
    const index = rowIndex * 8

    expect(columns[index].innerText).to.contain(location)
    expect(columns[index + 1].innerText).to.contain(cellType)
    expect(columns[index + 2].innerText).to.contain(capacity)
    expect(columns[index + 3].innerText).to.contain(spaces)
    expect(columns[index + 4].innerText).to.contain(occupier)
    expect(columns[index + 5].innerText).to.contain(csra)
    expect(columns[index + 6].innerText).to.contain(relevantAlerts)
    expect(columns[index + 7].innerText).to.contain(selectCell)
  }
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    ;['A12345', 'G6123VU'].forEach(anotherOffenderNo => {
      cy.task('stubGetPrisoner', {
        ...prisonerFullDetails,
        cellLocation: '1-2',
        prisonerNumber: anotherOffenderNo,
      })
    })
    cy.task('stubGroups', { id: 'MDI' })
    cy.task('stubActivePrisons', { activeAgencies: ['MDI'] })
    cy.task('stubGetPrisonerNonAssociations', {
      prisonerNumber: 'A12345',
      firstName: 'John',
      lastName: 'Smith',
      prisonId: 'MDI',
      prisonName: 'Moorland (HMP & YOI)',
      cellLocation: '1-2',
      openCount: 1,
      closedCount: 0,
      nonAssociations: [
        {
          reason: 'RIV',
          reasonDescription: 'Rival gang',
          role: 'VIC',
          roleDescription: 'Victim',
          restrictionType: 'LANDING',
          restrictionTypeDescription: 'Do Not Locate on Same Landing',
          whenCreated: '2020-06-17T00:00:00',
          comment: 'Gang violence',
          otherPrisonerDetails: {
            prisonerNumber: 'G6123VU',
            firstName: 'bob1',
            lastName: 'doe1',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP & YOI)',
            cellLocation: '1-1',
          },
        },
      ],
    })
  })

  context('with cell data', () => {
    const response = [
      {
        legacyAttributes: [
          { typeDescription: 'Gated Cell', type: 'GC' },
          { type: 'LC', typeDescription: 'Listener Cell' },
        ],
        specialistCellTypes: [
          { typeDescription: 'Listener / crisis cell', type: 'LISTENER_CRISIS' },
          { typeDescription: 'Locate flat', type: 'LOCATE_FLAT_CELL' },
        ],
        maxCapacity: 3,
        pathHierarchy: '1-1',
        noOfOccupants: 2,
        key: 'MDI-1-1',
        prisonId: 'MDI',
        prisonersInCell: [
          {
            prisonerNumber: 'G6123VU',
            firstName: 'Bob',
            lastName: 'Doe',
            cellLocation: '1-1',
            category: 'H',
            alerts: [
              {
                alertType: 'P',
                alertCode: 'PEEP',
                active: true,
                expired: false,
              },
            ],
            csra: 'Standard',
          },
        ],
      },
      {
        legacyAttributes: [
          { typeDescription: 'Special Cell', type: 'SPC' },
          { typeDescription: 'Gated Cell', type: 'GC' },
        ],
        specialistCellTypes: [
          { typeDescription: 'Biohazard / dirty protest cell', type: 'BIOHAZARD_DIRTY_PROTEST' },
          { typeDescription: 'Accessible cell', type: 'ACCESSIBLE_CELL' },
        ],
        maxCapacity: 2,
        pathHierarchy: '1-2',
        noOfOccupants: 1,
        prisonId: 'MDI',
        key: 'MDI-1-2',
        prisonersInCell: [
          {
            prisonerNumber: 'G6123VU',
            firstName: 'Horatio',
            lastName: 'McBubblesworth',
            cellLocation: '1-2',
            alerts: [],
          },
        ],
      },
    ]

    beforeEach(() => {
      cy.task('stubCellsWithCapacity', { prisonId: 'MDI', response })
      cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response })
    })

    it('should load without error', () => {
      const page = SelectCellPage.goTo(offenderNo)

      page.checkStillOnPage()
    })

    it('should display the correct cell information', () => {
      const page = SelectCellPage.goTo(offenderNo)

      page.cellResults().then($table => {
        cy.get($table).find('tr').its('length').should('eq', 2)
        cy.get($table)
          .find('tr')
          .then($tableRows => {
            const columns = $tableRows.find('td')

            assertRow(0, columns, {
              location: 'MDI-1-1',
              cellType: 'Listener / crisis cell,\nLocate flat',
              capacity: 3,
              spaces: 1,
              occupier: 'Doe, Bob\nView details\nfor Doe, Bob',
              csra: 'Standard\n\nView details\nfor Doe, Bob',
              relevantAlerts: 'PEEP\nCAT A High',
              selectCell: 'Select cell',
            })
          })
      })
    })

    it('should show non association warning', () => {
      const page = SelectCellPage.goTo(offenderNo, '1')
      page.numberOfNonAssociations().contains('1')
      page.nonAssociationWarning().contains('Smith, John has a non-association with a prisoner in this location.')
    })

    it('should NOT show the non association warning', () => {
      cy.task('stubGetPrisonerNonAssociations', null)
      const page = SelectCellPage.goTo(offenderNo)
      page.nonAssociationWarning().should('not.exist')
    })

    it('should display the correct cell swap messaging and link', () => {
      const page = SelectCellPage.goTo(offenderNo, '1')

      page
        .selectCswapText()
        .contains(
          'Create a space for another prisoner - this will leave John Smith without a cell. You must move them into a cell as soon as possible today.',
        )

      page
        .selectCswapLink()
        .invoke('attr', 'href')
        .then(href => {
          expect(href).to.equal('/prisoner/A12345/cell-move/confirm-cell-move?cellId=C-SWAP')
        })
    })
  })

  context('without cell data', () => {
    const response = []

    beforeEach(() => {
      cy.task('stubCellsWithCapacity', { prisonId: 'MDI', response })
      cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response })
    })

    it('should load without error and display no results message', () => {
      const page = SelectCellPage.goTo(offenderNo)

      page.checkStillOnPage()
      page.noResultsMessage().contains('There are no results for what you have chosen.')
    })

    describe('back button', () => {
      context('When referred from the search for a cell page', () => {
        beforeEach(() => {
          cy.task('stubGetPrisoner', {
            prisonerFullDetails,
            cellLocation: '1-1-1',
          })
          cy.task('stubGetPrisonerNonAssociations', {})
          cy.task('stubGroups', { id: 'MDI' })
          cy.visit('/prisoner/A12345/cell-move/search-for-cell')
        })

        it('should have a back button linking to the search for a cell page', () => {
          cy.contains('button', 'Search for a cell').click()
          cy.contains('Select an available cell')
          cy.contains('Back').click()
          cy.contains('Search for a cell')
        })
      })

      context('When the user clicked back from the consider risks page', () => {
        beforeEach(() => {
          cy.task('stubCellsWithCapacity', { prisonId: 'MDI', response })
          cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response })
          cy.task('stubOffenderFullDetails', offenderFullDetails)
          cy.task('stubGetPrisoner', {
            prisonerFullDetails,
            cellLocation: '1-1-1',
          })
          cy.task('stubGetPrisonerNonAssociations', {})
          cy.task('stubGroups', { id: 'MDI' })
          cy.task('stubLocation', {})
          cy.task('stubInmatesAtLocation', [
            {
              cellLocation: 'MDI-1-1-1',
              prisoners: [
                {
                  prisonerNumber: 'A12345',
                  firstName: 'BOB',
                  lastName: 'DOE',
                  prisonId: 'MDI',
                  prisonName: 'Moorland (HMP)',
                  cellLocation: '1-1-1',
                },
              ],
            },
          ])
          cy.task('stubGetPrisonerNonAssociations', {
            prisonerNumber: offenderNo,
            firstName: 'JOHN',
            lastName: 'SAUNDERS',
            prisonName: 'MOORLAND (HMP & YOI)',
            cellLocation: '1-1-015',
            nonAssociations: [],
          })

          ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
          cy.contains('Back').click()
          cy.contains('Select an available cell')
        })

        it('should have a back button linking to the search for a cell page', () => {
          cy.contains('Back').click()
          cy.contains('Search for a cell')
        })
      })
    })
  })
})
