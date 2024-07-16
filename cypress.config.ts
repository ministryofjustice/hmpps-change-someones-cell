import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import tokenVerification from './integration_tests/mockApis/tokenVerification'
import components from './integration_tests/mockApis/components'
import prisonApi from './integration_tests/mockApis/prisonApi'
import users from './integration_tests/mockApis/users'
import whereabouts from './integration_tests/mockApis/whereabouts'
import locationsInsidePrisonApi from './integration_tests/mockApis/locationsInsidePrisonApi'
import nonAssociationsApi from './integration_tests/mockApis/nonAssociationsApi'
import prisonerSearchApi from './integration_tests/mockApis/prisonerSearchApi'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    experimentalRunAllSpecs: true,
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        ...auth,
        ...tokenVerification,
        ...components,
        ...prisonApi,
        stubSignIn: ({ username = 'ITAG_USER', caseload = 'MDI', roles = ['ROLE_CELL_MOVE'], caseloads }) =>
          Promise.all([
            auth.stubSignIn(username, caseload, roles),
            users.stubUserMe(username, 12345, 'James Stuart', caseload),
            users.stubUserMeRoles(roles),
            prisonApi.stubUserCaseloads(caseloads),
            tokenVerification.stubVerifyToken(true),
          ]),
        stubAuthHealth: status => auth.stubHealth(status),
        stubHealthAllHealthy: () =>
          Promise.all([
            auth.stubHealth(),
            users.stubHealth(),
            prisonApi.stubHealth(),
            whereabouts.stubHealth(),
            locationsInsidePrisonApi.stubHealth(),
            tokenVerification.stubHealth(),
            prisonerSearchApi.stubHealth(),
          ]),
        stubSignInPage: auth.redirect,
        stubUserMe: ({ username, staffId, name }) => users.stubUserMe(username, staffId, name),
        stubInmates: prisonApi.stubInmates,
        stubOffenderFullDetails: fullDetails => Promise.all([prisonApi.stubOffenderFullDetails(fullDetails)]),
        stubGetPrisonerNonAssociations: response => nonAssociationsApi.stubGetPrisonerNonAssociations(response),
        stubGroups: caseload => locationsInsidePrisonApi.stubGroups(caseload),
        stubMainOffence: offence => prisonApi.stubMainOffence(offence),
        stubOffenderBasicDetails: basicDetails => Promise.all([prisonApi.stubOffenderBasicDetails(basicDetails)]),
        stubInmatesAtLocation: inmates => locationsInsidePrisonApi.stubInmatesAtLocation(inmates),
        stubOffenderCellHistory: ({ history }) => prisonApi.stubOffenderCellHistory(history),
        stubGetAlerts: ({ agencyId, alerts }) => prisonApi.stubGetAlerts({ agencyId, alerts }),
        stubCsraAssessments: ({ offenderNumbers, assessments }) =>
          prisonApi.stubCsraAssessments(offenderNumbers, assessments),
        stubLocation: location => locationsInsidePrisonApi.stubLocation(location),
        stubSpecificOffenderFullDetails: prisonApi.stubSpecificOffenderFullDetails,
        stubPrisonerFullDetail: ({ prisonerDetail, offenderNo, fullInfo }) =>
          prisonApi.stubPrisonerFullDetail(prisonerDetail, offenderNo, fullInfo),
        stubBookingDetails: details => prisonApi.stubBookingDetails(details),
        stubCellMoveTypes: type => prisonApi.stubCellMoveTypes(type),
        stubMoveToCell: () => whereabouts.stubMoveToCell(),
        stubMoveToCellSwap: () => prisonApi.stubMoveToCellSwap(),
        verifyMoveToCell: body => whereabouts.verifyMoveToCell(body),
        verifyMoveToCellSwap: ({ bookingId }) => prisonApi.verifyMoveToCellSwap({ bookingId }),
        stubAgencyDetails: ({ agencyId, details }) => Promise.all([prisonApi.stubAgencyDetails(agencyId, details)]),
        stubCellMoveHistory: ({ assignmentDate, agencyId, cellMoves }) =>
          prisonApi.stubCellMoveHistory({ assignmentDate, agencyId, cellMoves }),
        stubGetPrisoners: prisoners => Promise.all([prisonerSearchApi.stubGetPrisoners(prisoners)]),
        stubGetPrisoner: prisoner => Promise.all([prisonerSearchApi.stubGetPrisoner(prisoner)]),
        stubCellsWithCapacity: ({ prisonId, response }) =>
          locationsInsidePrisonApi.stubCellsWithCapacity({ prisonId, response }),
        stubCellsWithCapacityByGroupName: ({ prisonId, groupName, response }) =>
          locationsInsidePrisonApi.stubCellsWithCapacityByGroupName({ prisonId, groupName, response }),
        stubStaff: ({ staffId, details }) => Promise.all([prisonApi.stubStaff(staffId, details)]),
        stubGlobalAlerts: prisonApi.stubGlobalAlerts,
        stubReceptionWithCapacity: ({ agencyId, reception }) =>
          prisonApi.stubReceptionWithCapacity(agencyId, reception),
        stubOffendersInReception: ({ agencyId, inReception }) =>
          prisonApi.stubOffendersInReception(agencyId, inReception),
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
