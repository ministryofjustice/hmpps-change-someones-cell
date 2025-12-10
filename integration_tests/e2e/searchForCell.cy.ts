import moment from 'moment'
import SearchForCellPage from '../pages/searchForCellPage'
import SelectCellPage from '../pages/selectCellPage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderFullDetails = require('../mockApis/responses/offenderFullDetails.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisonerFullDetails = require('../mockApis/responses/prisonerFullDetails.json')

const offenderNo = 'A12345'

const locationsResponse = [
  {
    key: 'MDI-1-1-1',
    prisonId: 'MDI',
    maxCapacity: 1,
    pathHierarchy: '1-1',
    noOfOccupants: 0,
    prisonersInCell: [],
    legacyAttributes: [
      { type: 'LC', typeDescription: 'Listener Cell' },
      { typeDescription: 'Gated Cell', type: 'GC' },
    ],
  },
  {
    prisonId: 'MDI',
    key: 'MDI-1-2',
    maxCapacity: 2,
    pathHierarchy: '1-2',
    noOfOccupants: 2,
    legacyAttributes: [
      { typeDescription: 'Special Cell', type: 'SPC' },
      { typeDescription: 'Gated Cell', type: 'GC' },
    ],
    prisonersInCell: [
      {
        prisonerNumber: offenderNo,
        firstName: 'Bob',
        lastName: 'Doe',
        prisonId: 'MDI',
        prisonName: 'Leeds',
        cellLocation: '1-2',
        alerts: [],
      },
    ],
  },
]

context('A user can search for a cell', () => {
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubOffenderFullDetails', offenderFullDetails)
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber: offenderNo,
    })
    cy.task('stubGetPrisoner', prisonerFullDetails)
    cy.task('stubGetPrisonerNonAssociations', {
      prisonName: 'HMP Moorland',
      prisonerNumber: 'G3878UK',
      prisonId: 'MDI',
      nonAssociations: [],
      alerts: [
        {
          active: true,
          alertCode: 'XGANG',
          alertType: 'X',
          expired: false,
        },
      ],
    })
    cy.task('stubGroups', { id: 'MDI' })
    cy.task('stubActivePrisons')
    cy.task('stubCellsWithCapacity', { prisonId: 'MDI', locationsResponse })
    cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response: locationsResponse })
    cy.task('stubLocation', { locationId: 1, locationData: { parentLocationId: 2, description: 'MDI-1-1' } })
    cy.task('stubLocation', { locationId: 2, locationData: { parentLocationId: 3 } })
    cy.task('stubLocation', { locationId: 3, locationData: { locationPrefix: 'MDI-1' } })
  })

  it('Shows the correct data for no non-associations and no csra comment', () => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
    const page = SearchForCellPage.verifyOnPage()
    cy.get('[data-test="cell-move-header-information"]').find('h3').its('length').should('eq', 5)
    cy.get('[data-test="cell-move-header-information"]')
      .find('h3')
      .then($headings => {
        expect($headings.get(0).innerText).to.contain('Name')
        expect($headings.get(1).innerText).to.contain('Current location')
        expect($headings.get(2).innerText).to.contain('CSRA rating')
        expect($headings.get(3).innerText).to.contain('Relevant alerts')
        expect($headings.get(4).innerText).to.contain('Non-associations')
      })
    page.name().contains('Smith, John')
    page.livingUnit().contains('1-1-001')
    page.csra().contains('High')
    page.csraLink().should('be.visible')
    page.alerts().contains('None')
    page.nonAssociationsLink().should('not.exist')
    page.nonAssociationsMessage().contains('0 in NOMIS. Check local processes.')
  })

  context('Non-association and a CSR rating comment', () => {
    beforeEach(() => {
      cy.visit(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
    })
    it('Shows the correct data when there is a relevant non-association and a CSR rating comment', () => {
      cy.task('stubGetPrisoner', {
        ...prisonerFullDetails,
        prisonerNumber: offenderNo,
        alerts: [
          {
            active: true,
            alertCode: 'XGANG',
            alertType: 'X',
            expired: false,
          },
        ],
      })
      cy.task('stubGetPrisonerNonAssociations', {
        prisonName: 'HMP Moorland',
        prisonId: 'MDI',
        prisonerNumber: 'G3878UK',
        nonAssociations: [
          {
            whenCreated: moment(),
            otherPrisonerDetails: {
              prisonId: 'MDI',
              prisonName: 'HMP Moorland',
              prisonNumber: 'G3878UK',
            },
          },
        ],
      })
      const page = SearchForCellPage.verifyOnPage()
      cy.visit(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
      cy.get('[data-test="cell-move-header-information"]').find('h3').its('length').should('eq', 5)
      cy.get('[data-test="cell-move-header-information"]')
        .find('h3')
        .then($headings => {
          expect($headings.get(0).innerText).to.contain('Name')
          expect($headings.get(1).innerText).to.contain('Current location')
          expect($headings.get(2).innerText).to.contain('CSRA rating')
          expect($headings.get(3).innerText).to.contain('Relevant alerts')
          expect($headings.get(4).innerText).to.contain('Non-associations')
        })
      page.name().contains('Smith, John')
      page.detailsLink().contains('View details')
      page.livingUnit().contains('1-1-001')
      page.csra().contains('High')
      page.csraLink().contains('View details')
      page.alerts().contains('Gang member')
      page.numberOfNonAssociations().contains('1')
      page.nonAssociationsLink().contains('View non-associations')
      page.nonAssociationsMessage().should('not.exist')
    })
  })

  it('Passes the correct data to the select a cell page', () => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/search-for-cell`)
    const page = SearchForCellPage.verifyOnPage()
    const form = page.form()
    form.location().select('1')
    form.cellType().find('input[value="SO"]').check()
    form.submitButton().click()
    cy.url().should('include', 'select-cell?location=1&cellType=SO')
  })

  it('should display the correct cell swap messaging and link', () => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/search-for-cell`)

    const page = SearchForCellPage.verifyOnPage()

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

  describe('back button', () => {
    // inmate1 and inmate2 are data returned by prisonerCellAllocationService.getInmates
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
      firstName: 'STEVE',
      lastName: 'SMITH',
      bookingId: 2,
      alerts: [
        {
          alertType: 'R',
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

    context('When referred from the prisoner search page', () => {
      beforeEach(() => {
        cy.task('stubInmates', {
          locationId: 'MDI',
          count: 2,
          data: [inmate1, inmate2],
        })
        cy.task('stubGetPrisoners', [prisoner1, prisoner2])
        cy.visit(`/prisoner-search?keywords=SMITH`)
        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'A1234BC',
        })
        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'B4567CD',
        })
      })

      it('should have a back button linking to the previous page', () => {
        cy.contains('Change cell').click()
        cy.contains('Search for a cell')
        cy.contains('Back').click()
        cy.contains('Search for a prisoner')
      })
    })

    context('When referred from the view residential location page', () => {
      beforeEach(() => {
        cy.task('stubInmates', {
          locationId: 'MDI-1',
          count: 2,
          data: [inmate1, inmate2],
        })

        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'A1234BC',
        })
        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'B4567CD',
        })

        cy.task('stubGetPrisoners', [prisoner1, prisoner2])

        cy.visit(`/view-residential-location?location=1`)
      })

      it('should have a back button linking to the previous page', () => {
        cy.contains('Change cell').click()
        cy.contains('Search for a cell')
        cy.contains('Back').click()
        cy.contains('All prisoners in a residential location')
      })
    })

    context('When the user clicked back from the select cell page', () => {
      const response = [
        {
          attributes: [
            { description: 'Special Cell', code: 'SPC' },
            { description: 'Gated Cell', code: 'GC' },
          ],
          capacity: 2,
          description: 'LEI-1-2',
          id: 1,
          noOfOccupants: 2,
          userDescription: 'LEI-1-1',
        },
        {
          attributes: [
            { code: 'LC', description: 'Listener Cell' },
            { description: 'Gated Cell', code: 'GC' },
          ],
          capacity: 3,
          description: 'LEI-1-1',
          id: 1,
          noOfOccupants: 2,
          userDescription: 'LEI-1-1',
        },
      ]

      beforeEach(() => {
        cy.task('stubInmates', {
          locationId: 'MDI',
          count: 2,
          data: [inmate1, inmate2],
        })
        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'A1234BC',
        })
        cy.task('stubGetPrisoner', {
          ...prisonerFullDetails,
          prisonerNumber: 'B4567CD',
        })
        cy.task('stubGroups', { id: 'MDI' })
        cy.task('stubActivePrisons')
        cy.task('stubInmatesAtLocation', {
          inmates: [{ offenderNo: 'A12345', firstName: 'Bob', lastName: 'Doe', assignedLivingUnitId: 1 }],
        })

        cy.task('stubGetAlerts', { agencyId: 'MDI', alerts: [{ offenderNo: 'A12345', alertCode: 'PEEP' }] })
        cy.task('stubCsraAssessments', {
          offenderNumbers: ['A12345'],
          assessments: [
            {
              offenderNo: 'A12345',
              assessmentCode: 'CSRA',
              assessmentDescription: 'CSRA',
              assessmentComment: 'test',
              assessmentDate: '2020-01-10',
              classification: 'Standard',
              classificationCode: 'STANDARD',
            },
          ],
        })
        cy.task('stubGetPrisonerNonAssociations', {
          offenderNo: 'G6123VU',
          firstName: 'JOHN',
          lastName: 'SAUNDERS',
          agencyDescription: 'MOORLAND (HMP & YOI)',
          assignedLivingUnitDescription: 'MDI-1-1-015',
          nonAssociations: [],
        })
        cy.task('stubLocation', { locationId: 1, locationData: { parentLocationId: 2, description: 'MDI-1-1' } })
        cy.task('stubLocation', { locationId: 2, locationData: { parentLocationId: 3 } })
        cy.task('stubLocation', { locationId: 3, locationData: { locationPrefix: 'MDI-1' } })
        cy.task('stubCellsWithCapacity', { prisonId: 'MDI', response })
        cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response })

        SelectCellPage.goTo(inmate1.offenderNo)
        cy.contains('Select an available cell')
        cy.contains('Back').click()
        cy.contains('Search for a cell')
      })

      it('should have a back button linking to the prisoner search page', () => {
        cy.contains('Back').click()
        cy.contains('Search for a prisoner')
      })
    })
  })
})
