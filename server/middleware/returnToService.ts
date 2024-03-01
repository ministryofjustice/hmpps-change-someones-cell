export default () => async (req, res, next) => {
  if (req.query?.returnToService) req.session.returnToService = req.query.returnToService
  return next()
}
