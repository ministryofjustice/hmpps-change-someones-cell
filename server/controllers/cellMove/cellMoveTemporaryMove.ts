import { Request, Response } from 'express'
import { putLastNameFirst, formatLocation, formatName } from '../../utils'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'

type Params = {
  prisonerCellAllocationService: PrisonerCellAllocationService
}

export default ({ prisonerCellAllocationService }: Params) =>
  async (req: Request, res: Response) => {
    const {
      systemClientToken,
      user: { activeCaseLoad },
    } = res.locals
    const { keywords } = req.query

    if (!keywords) {
      const hasSearched = keywords !== undefined
      const emptySearchError = {
        href: '#keywords',
        text: 'Enter a prisoner’s name or number',
      }
      return res.render('cellMove/cellMoveTemporaryMove.njk', {
        showResults: false,
        showHelp: !hasSearched,
        errors: hasSearched ? [emptySearchError] : [],
      })
    }

    const currentUserCaseLoad = activeCaseLoad && activeCaseLoad.caseLoadId

    const prisoners = await prisonerCellAllocationService.getInmates(
      systemClientToken,
      currentUserCaseLoad,
      keywords as string,
    )

    const results =
      prisoners &&
      prisoners.map(prisoner => ({
        ...prisoner,
        assignedLivingUnitDesc: formatLocation(prisoner.assignedLivingUnitDesc),
        name: putLastNameFirst(prisoner.firstName, prisoner.lastName),
        formattedName: formatName(prisoner.firstName, prisoner.lastName),
        cellHistoryUrl: `/prisoner/${prisoner.offenderNo}/cell-history`,
        cellMoveUrl: `/prisoner/${prisoner.offenderNo}/cell-move/confirm-cell-move?cellId=C-SWAP`,
      }))

    return res.render('cellMove/cellMoveTemporaryMove.njk', {
      showResults: true,
      showHelp: false,
      formValues: { ...req.query },
      results,
      totalOffenders: results.length,
    })
  }
