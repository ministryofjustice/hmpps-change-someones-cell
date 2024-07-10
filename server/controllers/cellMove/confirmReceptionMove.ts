import { Request, Response, RequestHandler } from 'express'
import { properCaseName } from '../../utils'
import logger from '../../../logger'
import PrisonerDetailsService from '../../services/prisonerDetailsService'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import config from '../../config'
import { ReferenceCode } from '../../data/prisonApiClient'

const sortOnListSeq = (a: ReferenceCode, b: ReferenceCode) => a.listSeq - b.listSeq

const validate = ({ reason, comment }) => {
  const errors = []

  if (!reason) errors.push({ href: '#reason', text: 'Select a reason for the move' })
  if (!comment) errors.push({ href: '#comment', text: 'Explain why the person is being moved to reception' })
  if (comment && comment.length < 7) {
    errors.push({
      href: '#comment',
      text: 'Provide more detail about why this person is being moved to reception',
    })
  }
  if (comment && comment.length > 4000) {
    errors.push({
      href: '#comment',
      text: 'Enter what happened for you to move this person reception using 4,000 characters or less',
    })
  }

  return errors
}

type Params = {
  prisonerCellAllocationService: PrisonerCellAllocationService
  prisonerDetailsService: PrisonerDetailsService
}

export default ({ prisonerCellAllocationService, prisonerDetailsService }: Params) => {
  const receptionMoveReasons = async (token: string, selectedReason: string) => {
    const receptionMoveReasonTypes = await prisonerCellAllocationService.getCellMoveReasonTypes(token)
    return receptionMoveReasonTypes
      .filter(type => type.activeFlag === 'Y')
      .sort(sortOnListSeq)
      .map(type => ({
        value: type.code,
        text: type.description,
        checked: type.code === selectedReason,
      }))
  }

  const view = async (req: Request, res: Response) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals

    const { firstName, lastName } = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)

    let backUrl = `/prisoner/${offenderNo}/reception-move/consider-risks-reception`

    if (!req.session?.referrerUrl) {
      backUrl = null
    }

    const formValues = req.flash('formValues') as any[]
    const { reason, comment } = (formValues && formValues[0]) || {}
    const receptionMoveReasonRadioValues = await receptionMoveReasons(systemClientToken, reason)
    const cancelLinkHref = `${config.prisonerProfileUrl}/prisoner/${offenderNo}/location-details`

    const data = {
      offenderName: `${properCaseName(firstName)} ${properCaseName(lastName)}`,
      offenderNo,
      backUrl,
      cancelLinkHref,
      receptionMoveReasonRadioValues,
      errors: req.flash('errors'),
      formValues: {
        comment,
      },
    }

    return res.render('receptionMove/confirmReceptionMove.njk', data)
  }

  const post: RequestHandler = async (req: Request, res: Response) => {
    const { offenderNo } = req.params
    const { systemClientToken } = res.locals
    const { reason, comment } = req.body
    req.flash('formValues', { reason, comment } as any)
    const errors = validate({ reason, comment })

    if (errors.length) {
      req.flash('errors', errors)
      return res.redirect(`/prisoner/${offenderNo}/reception-move/confirm-reception-move`)
    }

    const { bookingId, prisonId } = await prisonerDetailsService.getPrisoner(systemClientToken, offenderNo)
    const receptionOccupancy = await prisonerCellAllocationService.getReceptionsWithCapacity(
      systemClientToken,
      prisonId,
    )

    if (!receptionOccupancy.length) {
      logger.info('Can not move to reception as already full to capacity')
      return res.redirect(`/prisoner/${offenderNo}/reception-move/reception-full`)
    }

    try {
      await prisonerCellAllocationService.moveToCell(
        systemClientToken,
        bookingId,
        offenderNo,
        receptionOccupancy[0].description,
        reason,
        comment,
      )

      // flush formValues from flash otherwise they will be carried over when the next prisoner is moved to reception
      req.flash('formValues')

      return res.redirect(`/prisoner/${offenderNo}/reception-move/confirmation`)
    } catch (error) {
      logger.error(`Error moving ${offenderNo} to reception`)
      res.locals.redirectUrl = `/prisoner/${offenderNo}/reception-move/consider-risks-reception`
      throw error
    }
  }

  return { view, post }
}
