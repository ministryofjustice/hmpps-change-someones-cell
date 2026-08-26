import { Request, Response } from 'express'
import { putLastNameFirst, formatLocation, formatName } from '../../utils'
import PrisonerCellAllocationService from '../../services/prisonerCellAllocationService'
import config from '../../config'

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

    const prisoners = await prisonerCellAllocationService.searchInmates(systemClientToken, currentUserCaseLoad, {
      term: keywords as string,
    })

    const results = prisoners.map(prisoner => ({
      offenderNo: prisoner.prisonerNumber,
      assignedLivingUnitDesc: formatLocation(prisoner.cellLocation),
      name: putLastNameFirst(prisoner.firstName, prisoner.lastName),
      formattedName: formatName(prisoner.firstName, prisoner.lastName),
      cellHistoryUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.prisonerNumber}/location-details`,
      cellMoveUrl: `/prisoner/${prisoner.prisonerNumber}/cell-move/confirm-cell-move?cellId=C-SWAP`,
      profileUrl: `${config.prisonerProfileUrl}/prisoner/${prisoner.prisonerNumber}`,
    }))

    return res.render('cellMove/cellMoveTemporaryMove.njk', {
      showResults: true,
      showHelp: false,
      formValues: { ...req.query },
      results,
      totalOffenders: results.length,
    })
  }
