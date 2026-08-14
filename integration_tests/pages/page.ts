export default (headerText: string, pageObject = {}) => {
  const checkOnPage = () => cy.get('h1').contains(headerText)
  checkOnPage()
  return { ...pageObject, checkStillOnPage: checkOnPage }
}
