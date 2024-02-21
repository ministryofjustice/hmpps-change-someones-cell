import config from '../../config'

export default () => async (req, res) => {
  const { offenderNo } = req.params
  const { cellDescription } = req.query

  try {
    if (!cellDescription) return res.redirect(`/prisoner/${offenderNo}/cell-move/select-cell`)

    return res.render('cellMove/cellNotAvailable.njk', {
      header: `Cell ${cellDescription} is no longer available`,
      selectCellUrl: `/prisoner/${offenderNo}/cell-move/select-cell`,
    })
  } catch (error) {
    res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/search-for-cell`
    res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
    throw error
  }
}
