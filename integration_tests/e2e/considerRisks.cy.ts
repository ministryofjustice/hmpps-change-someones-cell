import ConsiderRisksPage from '../pages/considerRisksPage'
import SelectCellPage from '../pages/selectCellPage'
import ConfirmCellMovePage from '../pages/confirmCellMovePage'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderFullDetails = require('../mockApis/responses/offenderFullDetails.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const offenderBasicDetails = require('../mockApis/responses/offenderBasicDetails.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisonerFullDetails = require('../mockApis/responses/prisonerFullDetails.json')

const offenderNo = 'A1234A'

const response = [
  {
    key: 'MDI-1-1-1',
    prisonId: 'MDI',
    maxCapacity: 1,
    pathHierarchy: '1-1-1',
    noOfOccupants: 0,
    prisonersInCell: [],
    legacyAttributes: [
      { type: 'LC', typeDescription: 'Listener Cell' },
      { typeDescription: 'Gated Cell', type: 'GC' },
    ],
  },
  {
    prisonId: 'MDI',
    key: 'MDI-1-1-2',
    maxCapacity: 2,
    pathHierarchy: '1-1-2',
    noOfOccupants: 2,
    legacyAttributes: [
      { typeDescription: 'Special Cell', type: 'SPC' },
      { typeDescription: 'Gated Cell', type: 'GC' },
    ],
    prisonersInCell: [
      {
        prisonerNumber: 'A12345',
        firstName: 'Bob',
        lastName: 'Doe',
        prisonId: 'MDI',
        prisonName: 'Moorland (HMP)',
        cellLocation: '1-1-2',
        alerts: [],
      },
    ],
  },
]

context('A user can see conflicts in cell', () => {
  const stubPrisonDetails = () => {
    cy.task('stubPrisonerFullDetail', {
      prisonerDetail: {
        bookingId: 1234,
        offenderNo,
        firstName: 'Test',
        lastName: 'User',
        csra: 'High',
        csraClassificationCode: 'HI',
        agencyId: 'MDI',
        categoryCode: 'A',
        assessments: [],
        assignedLivingUnit: {},
        alerts: [
          {
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
            alertCode: 'RLG',
            alertCodeDescription: 'Risk to LGB',
            alertId: 1,
            alertType: 'X',
            alertTypeDescription: 'Risk to LGB',
            bookingId: 14,
            comment: 'has a large poster on cell wall',
            dateCreated: '2019-08-20',
            dateExpires: null,
            expired: false,
            expiredByFirstName: 'John',
            expiredByLastName: 'Smith',
            offenderNo,
          },
          {
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
            alertCode: 'XEL',
            alertCodeDescription: 'E-List',
            alertId: 1,
            alertType: 'X',
            alertTypeDescription: 'Security',
            bookingId: 14,
            comment: 'has a large poster on cell wall',
            dateCreated: '2019-08-20',
            dateExpires: null,
            expired: false,
            expiredByFirstName: 'John',
            expiredByLastName: 'Smith',
            offenderNo,
          },
          {
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
            alertCode: 'XGANG',
            alertCodeDescription: 'Gang member',
            alertId: 1,
            alertType: 'X',
            alertTypeDescription: 'Security',
            bookingId: 14,
            dateCreated: '2019-08-20',
            dateExpires: null,
            expired: false,
            expiredByFirstName: 'John',
            expiredByLastName: 'Smith',
            offenderNo,
          },
          {
            alertId: 3,
            alertType: 'V',
            alertTypeDescription: 'Vulnerability',
            alertCode: 'VIP',
            alertCodeDescription: 'Isolated Prisoner',
            comment: 'test',
            dateCreated: '2020-08-20',
            expired: false,
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
          },
          {
            alertId: 4,
            alertType: 'H',
            alertTypeDescription: 'Self Harm',
            alertCode: 'HA',
            alertCodeDescription: 'ACCT open',
            comment: 'Test comment',
            dateCreated: '2021-02-18',
            expired: false,
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
          },
          {
            alertId: 5,
            alertType: 'H',
            alertTypeDescription: 'Self Harm',
            alertCode: 'HA1',
            alertCodeDescription: 'ACCT post closure',
            comment: '',
            dateCreated: '2021-02-19',
            expired: false,
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
          },
        ],
        profileInformation: [],
      },
      offenderNo,
    })
    cy.task('stubPrisonerFullDetail', {
      prisonerDetail: {
        bookingId: 1235,
        firstName: 'Occupant',
        lastName: 'User',
        csra: 'High',
        csraClassificationCode: 'HI',
        agencyId: 'MDI',
        offenderNo: 'A12346',
        assessments: [],
        assignedLivingUnit: {},
        categoryCode: 'B',
        alerts: [
          {
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
            alertCode: 'XC',
            alertCodeDescription: 'Risk to females',
            alertId: 1,
            alertType: 'X',
            alertTypeDescription: 'Security',
            bookingId: 14,
            comment: 'has a large poster on cell wall',
            dateCreated: '2019-08-20',
            dateExpires: null,
            expired: false,
            expiredByFirstName: 'John',
            expiredByLastName: 'Smith',
            offenderNo,
          },
          {
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
            alertCode: 'XGANG',
            alertCodeDescription: 'Gang member',
            alertId: 1,
            alertType: 'X',
            alertTypeDescription: 'Security',
            bookingId: 14,
            comment: 'has a large poster on cell wall',
            dateCreated: '2019-08-20',
            dateExpires: null,
            expired: false,
            expiredByFirstName: 'John',
            expiredByLastName: 'Smith',
            offenderNo,
          },
          {
            alertId: 3,
            alertType: 'V',
            alertTypeDescription: 'Vulnerability',
            alertCode: 'VIP',
            alertCodeDescription: 'Isolated Prisoner',
            comment: 'test',
            dateCreated: '2020-08-20',
            expired: false,
            active: true,
            addedByFirstName: 'John',
            addedByLastName: 'Smith',
          },
        ],
        profileInformation: [{ type: 'SEXO', resultValue: 'Homosexual' }],
      },
      offenderNo: 'A12345',
    })
    cy.task('stubGetPrisoner', {
      prisonerFullDetails,
      firstName: 'Bob',
      lastName: 'Doe',
    })
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber: 'A12345',
    })
    cy.task('stubGetPrisoner', {
      ...prisonerFullDetails,
      prisonerNumber: offenderNo,
      firstName: 'Bob',
      lastName: 'Doe',
    })
  }
  before(() => {
    cy.clearCookies()
    cy.task('reset')
    cy.task('stubComponentsFail')
    cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
    cy.signIn()
  })
  beforeEach(() => {
    cy.task('stubGetPrisonerNonAssociations', {
      prisonerNumber: offenderNo,
      firstName: 'JOHN',
      lastName: 'SAUNDERS',
      prisonId: 'MDI',
      prisonName: 'MOORLAND (HMP & YOI)',
      cellLocation: '1-1-015',
      nonAssociations: [
        {
          role: 'VIC',
          roleDescription: 'Victim',
          reason: 'RIV',
          reasonDescription: 'Rival Gang',
          restrictionType: 'LAND',
          restrictionTypeDescription: 'Do Not Locate on Same Landing',
          whenCreated: '2020-06-17T00:00:00',
          comment: 'Gang violence',
          otherPrisonerDetails: {
            prisonerNumber: 'A12345',
            firstName: 'bob1',
            lastName: 'doe1',
            role: 'PER',
            roleDescription: 'Perpetrator',
            prisonName: 'MOORLAND (HMP & YOI)',
            cellLocation: '1-3-026',
          },
        },
      ],
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

    cy.task('stubInmatesAtLocation', [
      {
        cellLocation: '1-1-1',
        prisoners: [
          {
            prisonerNumber: 'A12345',
            firstName: 'Bob',
            lastName: 'Doe',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP)',
            cellLocation: '1-1-1',
            alerts: [],
          },
        ],
      },
    ])
    cy.task('stubGroups', { id: 'MDI' })
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
  })

  it('should load with correct data', () => {
    stubPrisonDetails()
    const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
    page.nonAssociationsSubTitle().contains('Test User has a non-association with a prisoner on this wing:')
    page.nonAssociationsSummary().then($summary => {
      cy.get($summary).find('dt').its('length').should('eq', 6)
      cy.get($summary)
        .find('dt')
        .then($summaryLabels => {
          expect($summaryLabels.get(0).innerText).to.contain('Name')
          expect($summaryLabels.get(1).innerText).to.contain('Prison number')
          expect($summaryLabels.get(2).innerText).to.contain('Location')
          expect($summaryLabels.get(3).innerText).to.contain('Type')
          expect($summaryLabels.get(4).innerText).to.contain('Reason')
          expect($summaryLabels.get(5).innerText).to.contain('Comment')
        })

      cy.get($summary).find('dd').its('length').should('eq', 6)
      cy.get($summary)
        .find('dd')
        .then($summaryContent => {
          expect($summaryContent.get(0).innerText).to.contain('Doe1, Bob1')
          expect($summaryContent.get(1).innerText).to.contain('A12345')
          expect($summaryContent.get(2).innerText).to.contain('1-3-026')
          expect($summaryContent.get(3).innerText).to.contain('Do Not Locate on Same Landing')
          expect($summaryContent.get(4).innerText).to.contain('Rival Gang')
          expect($summaryContent.get(5).innerText).to.contain('Gang violence')
        })
    })
    page
      .csraMessages()
      .find('li')
      .then($messages => {
        cy.get($messages).its('length').should('eq', 2)
        expect($messages.get(0).innerText).to.contain('Test User is CSRA High')
        expect($messages.get(1).innerText).to.contain('Occupant User is CSRA High')
      })
    page.offenderAlertsHeading().contains('Test User has:')
    page.offenderAlertMessages().then($messages => {
      cy.get($messages).its('length').should('eq', 6)
      expect($messages.get(0)).to.contain(
        'a Risk to LGB alert and Occupant User has a sexual orientation of Homosexual',
      )
      expect($messages.get(1)).to.contain('an E-List alert')
      expect($messages.get(2)).to.contain('a Gang member alert')
      expect($messages.get(3)).to.contain('an Isolated Prisoner alert')
      expect($messages.get(4)).to.contain('an ACCT open alert')
      expect($messages.get(5)).to.contain('an ACCT post closure alert')
    })
    page.categoryWarning().contains('a Cat A rating and Occupant User is a Cat B')
    page.occupantAlertsHeading().contains('Occupant User has:')
    page.occupantAlertMessages().then($messages => {
      cy.get($messages).its('length').should('eq', 2)
      expect($messages.get(0)).to.contain('a Gang member alert')
      expect($messages.get(1)).to.contain('an Isolated Prisoner alert')
    })
    page.alertsComments().then($messages => {
      cy.get($messages).its('length').should('eq', 8)
      expect($messages.get(0)).to.contain('has a large poster on cell wall')
      expect($messages.get(1)).to.contain('has a large poster on cell wall')
      expect($messages.get(2)).to.contain('No details entered')
      expect($messages.get(3)).to.contain('test')
      expect($messages.get(4)).to.contain('Test comment')
      expect($messages.get(5)).to.contain('No details entered')
    })
    page.alertsDates().then($dates => {
      cy.get($dates).its('length').should('eq', 8)
      expect($dates.get(0)).to.contain('Date added: 20 August 2019')
      expect($dates.get(1)).to.contain('Date added: 20 August 2019')
      expect($dates.get(2)).to.contain('Date added: 20 August 2019')
      expect($dates.get(3)).to.contain('Date added: 20 August 2020')
      expect($dates.get(4)).to.contain('Date added: 18 February 2021')
      expect($dates.get(5)).to.contain('Date added: 19 February 2021')
      expect($dates.get(6)).to.contain('Date added: 20 August 2019')
      expect($dates.get(7)).to.contain('Date added: 20 August 2020')
    })
    page.form().confirmationInput().contains('Are you sure you want to move Test User into a cell with Occupant User?')
  })

  it('should show error when nothing is selected', () => {
    stubPrisonDetails()
    const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
    page.form().submitButton().click()
    page.errorSummary().contains('Select yes if you are sure you want to select the cell')
  })

  it('should redirect to select cell if NO is selected', () => {
    stubPrisonDetails()
    const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
    page.form().confirmationNo().click()
    page.form().submitButton().click()
    cy.url().should('include', '/select-cell')
  })

  it('should redirect to confirm cell move on continue', () => {
    stubPrisonDetails()
    const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')

    cy.task('stubBookingDetails', { firstName: 'Bob', lastName: 'Doe' })
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

    page.form().confirmationYes().click()

    page.form().submitButton().click()

    ConfirmCellMovePage.verifyOnPage('Bob Doe', '1-1-1')
  })

  it('should redirect to confirm cell when there are no warnings', () => {
    cy.task('stubGetPrisonerNonAssociations', {})
    cy.task('stubInmatesAtLocation', [
      {
        cellLocation: '1-1-1',
        prisoners: [
          {
            prisonerNumber: offenderNo,
            firstName: 'Bob',
            lastName: 'Doe',
            prisonId: 'MDI',
            prisonName: 'Moorland (HMP)',
            cellLocation: '1-1-1',
            alerts: [],
          },
        ],
      },
    ])
    cy.task('stubBookingDetails', {
      firstName: 'Bob',
      lastName: 'Doe',
      offenderNo,
      bookingId: 1234,
      alerts: [],
    })
    cy.task('stubGetPrisoner', {
      firstName: 'Bob',
      lastName: 'Doe',
      prisonerNumber: offenderNo,
      bookingId: 1234,
      alerts: [],
    })
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

    cy.visit(`/prisoner/${offenderNo}/cell-move/consider-risks?cellId=MDI-1-1-1`)

    ConfirmCellMovePage.verifyOnPage('Bob Doe', '1-1-1')
  })

  it('should not show CSRA messages and have the correct confirmation label', () => {
    cy.task('stubInmatesAtLocation', [])

    cy.task('stubOffenderFullDetails', offenderFullDetails)

    const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
    page.csraMessages().should('not.exist')
    page.form().confirmationInput().contains('Are you sure you want to select this cell?')
  })

  describe('back button', () => {
    before(() => {
      cy.clearCookies()
      cy.task('reset')
      cy.task('stubComponentsFail')
      cy.task('stubSignIn', { username: 'ITAG_USER', caseload: 'MDI', roles: ['ROLE_CELL_MOVE'] })
      cy.signIn()
    })

    beforeEach(() => {
      cy.task('stubOffenderBasicDetails', offenderBasicDetails)
      cy.task('stubOffenderFullDetails', offenderFullDetails)
      cy.task('stubGroups', { id: 'MDI' })
      cy.task('stubGetPrisoner', {
        firstName: 'Bob',
        lastName: 'Doe',
        prisonId: 'MDI',
        prisonerNumber: 'A12345',
        bookingId: 1234,
        alerts: [],
      })
      cy.task('stubGetPrisoner', prisonerFullDetails)
      cy.task('stubGetPrisoner', {
        firstName: 'Bob',
        lastName: 'Doe',
        prisonId: 'MDI',
        prisonerNumber: offenderNo,
        bookingId: 1234,
        alerts: [],
      })
      cy.task('stubInmatesAtLocation', [
        {
          cellLocation: '1-1-1',
          prisoners: [
            {
              prisonerNumber: 'A12345',
              firstName: 'Bob',
              lastName: 'Doe',
              prisonId: 'MDI',
              prisonName: 'Moorland (HMP)',
              cellLocation: '1-1-1',
              alerts: [],
            },
          ],
        },
      ])
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
        prisonerNumber: 'A12345',
        firstName: 'JOHN',
        lastName: 'SAUNDERS',
        prisonName: 'MOORLAND (HMP & YOI)',
        prisonId: 'MDI',
        cellLocation: '1-1-015',
        nonAssociations: [],
      })
      cy.task('stubLocation', { prisonId: 'MDI', key: 'MDI-1-1-2', pathHierarchy: '1-1-2', parentId: 'uuid2' })
      cy.task('stubLocation', { prisonId: 'MDI', key: 'MDI-1-2', pathHierarchy: '1-2', parentId: 'uuid1' })
      cy.task('stubLocation', { prisonId: 'MDI', key: 'MDI-1-1', pathHierarchy: '1-1', parentId: 'uuid1' })
      cy.task('stubLocation', { prisonId: 'MDI', key: 'MDI-1', pathHierarchy: '1', parentId: null })
    })

    context('When referred from the select cell page', () => {
      beforeEach(() => {
        cy.task('stubCellsWithCapacity', { prisonId: 'MDI', response })
        cy.task('stubCellsWithCapacityByGroupName', { prisonId: 'MDI', groupName: 1, response })
        SelectCellPage.goTo('A12345', 'ALL')
        cy.contains('Select an available cell')
        cy.contains('.govuk-link', 'Select cell').click()
        cy.contains('You must consider the risks of the prisoners involved')
      })

      it('should have a back button linking to the prisoner search page', () => {
        cy.contains('Back').click()
        cy.contains('Select an available cell')
      })

      it('should still have the correct back link when validation errors are shown', () => {
        stubPrisonDetails()
        const page = ConsiderRisksPage.goTo(offenderNo, 'MDI-1-1-1')
        page.form().submitButton().click()
        page.errorSummary().contains('Select yes if you are sure you want to select the cell')
        cy.contains('Back').click()
        cy.contains('Select an available cell')
      })
    })
  })
})
