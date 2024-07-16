import logger from '../../../logger'
import config from '../../config'
import AnalyticsService from '../../services/analyticsService'
import LocationService from '../../services/locationService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import { properCaseName, putLastNameFirst } from '../../utils'
import { getConfirmBackLinkData } from './cellMoveUtils'
import { ReferenceCode } from '../../data/prisonApiClient'

const CSWAP = 'C-SWAP'

const sortOnListSeq = (a: ReferenceCode, b: ReferenceCode) => a.listSeq - b.listSeq

const cellMoveReasons = async (
  token,
  prisonerCellAllocationService: PrisonerCellAllocationService,
  selectedReason: string,
) => {
  const cellMoveReasonTypes = await prisonerCellAllocationService.getCellMoveReasonTypes(token)
  return cellMoveReasonTypes
    .filter(type => type.activeFlag === 'Y')
    .sort(sortOnListSeq)
    .map(type => ({
      value: type.code,
      text: type.description,
      checked: type.code === selectedReason,
    }))
}

type Params = {
  analyticsService: AnalyticsService
  locationService: LocationService
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({
  analyticsService,
  locationService,
  prisonerCellAllocationService,
  prisonerDetailsService,
}: Params) => {
  const index = async (req, res) => {
    const { offenderNo } = req.params
    const { cellId } = req.query
    const isCellSwap = cellId === CSWAP

    const { systemClientToken } = res.locals

    if (!cellId) return res.redirect(`/prisoner/${offenderNo}/cell-move/select-cell`)

    const { pathHierarchy } = isCellSwap
      ? { pathHierarchy: 'swap' }
      : await locationService.getLocation(systemClientToken, cellId)

    const { firstName, lastName } = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)

    const formValues = req.flash('formValues')
    const { reason, comment } = (formValues && formValues[0]) || {}

    const cellMoveReasonRadioValues = isCellSwap
      ? undefined
      : await cellMoveReasons(systemClientToken, prisonerCellAllocationService, reason)

    const { backLink, backLinkText } = getConfirmBackLinkData(req.session?.referrerUrl, offenderNo)
    return res.render('cellMove/confirmCellMove.njk', {
      showWarning: !isCellSwap,
      offenderNo,
      breadcrumbPrisonerName: putLastNameFirst(firstName, lastName),
      name: `${properCaseName(firstName)} ${properCaseName(lastName)}`,
      cellId,
      movingToHeading: isCellSwap ? 'out of their current location' : `to cell ${pathHierarchy}`,
      cellMoveReasonRadioValues,
      errors: req.flash('errors'),
      formValues: {
        comment,
      },
      backLink,
      backLinkText,
      showCommentInput: !isCellSwap,
    })
  }

  const sendCellMoveAnalyticsEvent = (req, agencyId: string, cellType: string) => {
    // eslint-disable-next-line no-underscore-dangle
    const gaClientId = req.cookies?._ga?.match(/.*\.(\d+\.\d+)$/)[1]

    analyticsService
      .sendEvents(gaClientId, [
        {
          name: 'cell_move',
          params: {
            agency_id: agencyId,
            cell_type: cellType,
          },
        },
      ])
      .catch(_reason => {
        logger.warn('Failed to send Google Analytics event')
      })
  }

  const makeCellMove = async (req, res, { cellId, bookingId, agencyId, offenderNo, reasonCode, commentText }) => {
    const { systemClientToken } = res.locals
    const { capacity, key, pathHierarchy } = await locationService.getLocation(systemClientToken, cellId)
    const actualCapacity = capacity.workingCapacity || capacity.maxCapacity
    try {
      await prisonerCellAllocationService.moveToCell(
        systemClientToken,
        bookingId,
        offenderNo,
        key,
        reasonCode,
        commentText,
      )
    } catch (error) {
      if (error.status === 400)
        return res.redirect(`/prisoner/${offenderNo}/cell-move/cell-not-available?cellDescription=${pathHierarchy}`)

      if (error.status === 423) {
        const error423: any[] = [
          {
            text: 'This cell move cannot be carried out because a user currently has this prisoner open in P-Nomis, please try later',
          },
        ]
        const { reason, comment } = req.body
        req.flash('errors', error423)
        req.flash('formValues', { comment, reason })
        return res.redirect(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=${cellId}`)
      }
      throw error
    }

    const cellType = actualCapacity === 1 ? 'Single occupancy' : 'Multi occupancy'
    sendCellMoveAnalyticsEvent(req, agencyId, cellType)

    return res.redirect(`/prisoner/${offenderNo}/cell-move/confirmation?cellId=${cellId}`)
  }

  const makeCSwap = async (req, res, { bookingId, agencyId, offenderNo }) => {
    const { systemClientToken } = res.locals

    await prisonerCellAllocationService.moveToCellSwap(systemClientToken, bookingId)

    sendCellMoveAnalyticsEvent(req, agencyId, 'C-SWAP')

    return res.redirect(`/prisoner/${offenderNo}/cell-move/space-created`)
  }

  const validate = ({ reason, comment }) => {
    const errors = []

    if (!reason) errors.push({ href: '#reason', text: 'Select the reason for the cell move' })
    if (!comment) errors.push({ href: '#comment', text: 'Enter what happened for you to change this person’s cell' })
    if (comment && comment.length < 7) {
      errors.push({
        href: '#comment',
        text: 'Enter a real explanation of what happened for you to change this person’s cell',
      })
    }
    if (comment && comment.length > 4000) {
      errors.push({
        href: '#comment',
        text: 'Enter what happened for you to change this person’s cell using 4,000 characters or less',
      })
    }

    return errors
  }

  const post = async (req, res) => {
    const { systemClientToken } = res.locals

    const { offenderNo } = req.params
    const { cellId, reason, comment } = req.body

    if (!cellId) return res.redirect(`/prisoner/${offenderNo}/cell-move/select-cell`)

    if (cellId !== CSWAP) {
      const errors = validate({ reason, comment })

      if (errors.length) {
        req.flash('formValues', { comment, reason })
        req.flash('errors', errors)
        return res.redirect(`/prisoner/${offenderNo}/cell-move/confirm-cell-move?cellId=${cellId}`)
      }
    }

    try {
      const { bookingId, prisonId } = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)
      const agencyId = prisonId
      if (cellId === CSWAP) return await makeCSwap(req, res, { agencyId, bookingId, offenderNo })

      return await makeCellMove(req, res, {
        cellId,
        bookingId,
        agencyId,
        offenderNo,
        reasonCode: reason,
        commentText: comment,
      })
    } catch (error) {
      res.locals.logMessagev = `Failed to make cell move to ${cellId}`
      res.locals.redirectUrl = `/prisoner/${offenderNo}/cell-move/select-cell`
      res.locals.homeUrl = `${config.prisonerProfileUrl}/prisoner/${offenderNo}`
      throw error
    }
  }

  return {
    index,
    post,
  }
}
