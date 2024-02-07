import moment from 'moment'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

const mergeArrays = (result, current) => [...result, ...current]

type Params = {
  prisonerCellAllocationService: PrisonerCellAllocationService
}

export default ({ prisonerCellAllocationService }: Params) =>
  async (req, res) => {
    const { systemClientToken, user } = res.locals
    const { activeCaseLoad } = user

    const lastSevenDays = [...Array(7).keys()].map(days => moment().subtract(days, 'day').format('YYYY-MM-DD'))

    const cellMoves = (
      await Promise.all(
        lastSevenDays.map(date =>
          prisonerCellAllocationService.getHistoryByDate(systemClientToken, activeCaseLoad.caseLoadId, date),
        ),
      )
    ).reduce(mergeArrays, [])

    const stats = lastSevenDays.map(date => ({
      date,
      dateDisplay: moment(date, 'YYYY-MM-DD').format('dddd D MMMM YYYY'),
      count: cellMoves.filter(move => move.assignmentDate === date).length,
    }))

    return res.render('cellMove/recentCellMoves.njk', {
      stats,
    })
  }
