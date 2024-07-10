import moment from 'moment'
import { formatName, formatLocation, stripAgencyPrefix, putLastNameFirst } from '../../utils'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { UserService } from '../../services'

const latestBedAssignment = (left, right) => right.bedAssignmentHistorySequence - left.bedAssignmentHistorySequence
const formatLocationDescription = (description, agencyId) => formatLocation(stripAgencyPrefix(description, agencyId))

const matchesLocationPrefix = (description: string, locationPrefix: string) => {
  if (locationPrefix.length > description.length) return false

  const data = description.substr(0, locationPrefix.length)
  return data === locationPrefix
}

const dateTimeFormat = 'YYYY-MM-DDTHH:mm'

const sortByMostEarliestFirst = (left, right) => {
  const leftDate = moment(left.assignmentDateTime, dateTimeFormat)
  const rightDate = moment(right.assignmentDateTime, dateTimeFormat)

  if (leftDate.isAfter(rightDate, 'minute')) return -1
  if (leftDate.isBefore(rightDate, 'minute')) return 1

  return 0
}

type Params = {
  locationService: LocationService
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
  userService: UserService
}

export default ({ locationService, prisonerCellAllocationService, prisonerDetailsService, userService }: Params) => {
  const prisonApiLocationDescription = async (res, locationKey, userCaseLoad) => {
    const { systemClientToken } = res.locals
    const fullLocationPrefix = await locationService.getAgencyGroupLocationPrefix(
      systemClientToken,
      userCaseLoad,
      locationKey,
    )
    if (fullLocationPrefix) {
      const locationIdWithSuffix = fullLocationPrefix.locationPrefix
      return locationIdWithSuffix?.length < 1 ? '' : locationIdWithSuffix.slice(0, -1)
    }
    return `${userCaseLoad}-${locationKey}`
  }

  return async (req, res) => {
    if (!req?.query?.date) return res.redirect('/recent-cell-moves')

    const { date, locationId, reason } = req.query

    const { systemClientToken, user } = res.locals
    const { activeCaseLoad } = user

    const filterByLocationPrefix =
      locationId && (await prisonApiLocationDescription(res, req.query.locationId, activeCaseLoad.caseLoadId))

    const currentUserLocations = await locationService.searchGroups(systemClientToken, activeCaseLoad.caseLoadId)

    const locations = currentUserLocations.map(locationData => ({ text: locationData.name, value: locationData.key }))

    const cellMoveHistory = (
      await prisonerCellAllocationService.getHistoryByDate(systemClientToken, activeCaseLoad.caseLoadId, date)
    ).filter(
      item =>
        (!filterByLocationPrefix || matchesLocationPrefix(item.description, filterByLocationPrefix)) &&
        (!reason || item.assignmentReason === reason),
    )
    const usernames = [...new Set(cellMoveHistory.map(cellMove => cellMove.movementMadeBy))]
    const offenderNos = [...new Set(cellMoveHistory.map(cellMove => cellMove.offenderNo))]
    const cellMoveTypes = await prisonerCellAllocationService.getCellMoveReasonTypes(systemClientToken)

    const staffMembers = await Promise.all(
      usernames.map(username => userService.getStaffDetails(systemClientToken, username)),
    )

    const cellMoveReasons = cellMoveTypes.map(subType => ({
      value: subType.code,
      text: subType.description,
    }))

    const offenders = await prisonerDetailsService.getPrisoners(systemClientToken, offenderNos)

    const bookingIds = (offenders && [...new Set(offenders.map(o => o.bookingId))]) || []

    const cellHistoryByOffenderNo = await Promise.all(
      bookingIds.map(bookingId =>
        prisonerCellAllocationService
          .getOffenderCellHistory(systemClientToken, bookingId)
          .then(result => result.content.flatMap(history => history))
          .catch(error => {
            if (error?.response?.status === 404) return null

            throw error
          }),
      ),
    )

    const historyByDate = cellMoveHistory.sort(sortByMostEarliestFirst).map(history => {
      const offender = offenders.find(o => o.prisonerNumber === history.offenderNo)
      const staff = staffMembers.find(s => s.username === history.movementMadeBy)
      const movementReason = cellMoveTypes.find(type => type.code === history.assignmentReason)
      const assignmentTime = moment(history.assignmentDateTime, dateTimeFormat).format('HH:mm')

      const movedFrom = (cellHistoryByOffenderNo || [])
        .flatMap(offenderHistory => offenderHistory)
        .filter(
          ch =>
            ch?.offenderNo === history.offenderNo &&
            ch?.assignmentEndDate === history.assignmentDate &&
            history.livingUnitId !== ch.livingUnitId,
        )
        .sort(latestBedAssignment)

      return {
        prisonerName: putLastNameFirst(offender?.firstName, offender?.lastName),
        offenderNo: history.offenderNo,
        movedFrom:
          (movedFrom.length && formatLocationDescription(movedFrom[0]?.description, movedFrom[0]?.agencyId)) ||
          'No cell allocated',
        movedTo: formatLocationDescription(history.description, history.agencyId),
        movedBy: formatName(staff?.firstName, staff?.lastName),
        reason: movementReason?.description || 'Not entered',
        time: assignmentTime,
      }
    })

    return res.render('cellMove/cellMoveHistory.njk', {
      title: `Cell moves completed on ${moment(date, 'YYYY-MM-DD').format('dddd D MMMM YYYY')}`,
      historyByDate,
      cellMoveReasons,
      locations,
      formValues: {
        date,
        locationId,
        reason,
      },
    })
  }
}
