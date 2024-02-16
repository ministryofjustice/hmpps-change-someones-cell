import page from './page'

const receptionConfirmationPage: () => any = () =>
  page('John Smith has been moved to reception', {
    backLink: () => cy.get('a.govuk-link'),
    surveyLink: () =>
      cy
        .get("[data-test='exit-survey-link']")
        .invoke('attr', 'href')
        .then(href => {
          expect(href).to.equal('https://eu.surveymonkey.com/r/3JHPDDD')
        }),
    finishLink: () =>
      cy
        .get("[data-test='profile']")
        .invoke('attr', 'href')
        .then(href => {
          expect(href).to.equal('http://localhost:3101/prisoner/G3878UK')
        }),
  })

export default {
  verifyOnPage: receptionConfirmationPage,
  goTo: offenderNo => {
    cy.visit(`/prisoner/${offenderNo}/reception-move/confirmation`, { failOnStatusCode: false })
    return receptionConfirmationPage()
  },
}
