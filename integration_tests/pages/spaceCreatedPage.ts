import page from './page'

const spaceCreatedPage = (name: string): any =>
  page(`${name} has been moved`, {
    backToSearchLink: () => cy.get("[data-test='back-to-search']"),
  })

export default {
  goTo: ({ offenderNo, name }) => {
    cy.visit(`/prisoner/${offenderNo}/cell-move/space-created`)
    return spaceCreatedPage(name)
  },
}
