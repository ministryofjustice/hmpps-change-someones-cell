import cellMoveHomepageController from './cellMoveHomepage'

describe('Homepage', () => {
  const req: any = {}
  const res: any = {
    locals: { user: { activeCaseLoad: { description: 'Moorland (HMP)' } } },
    render: jest.fn(),
    redirect: jest.fn(),
  }

  describe('Tasks', () => {
    it('should render template with correct non role specfic tasks', async () => {
      await cellMoveHomepageController(req, res)

      expect(res.render).toHaveBeenCalledWith('cellMove/cellMoveHomepage', {
        tasks: [
          {
            id: 'search-for-prisoner',
            heading: 'Search for a prisoner',
            description: 'Change someone’s cell after searching for them using their name or prison number.',
            href: '/prisoner-search',
          },
          {
            id: 'view-residential-location',
            heading: 'View residential location',
            description:
              'View all prisoners in a residential location. You can view their cell history and change their cell.',
            href: '/view-residential-location',
          },
          {
            id: 'create-space',
            heading: 'Move someone temporarily out of a cell',
            description:
              'Create a space for another prisoner by moving someone out of a cell temporarily. You will need to allocate a cell to them later.',
            href: '/temporary-move',
          },
          {
            id: 'view-history',
            heading: 'View 7 day cell move history',
            description: 'View all cell moves completed over the last 7 days in Moorland (HMP).',
            href: '/recent-cell-moves',
          },
          {
            id: 'no-cell-allocated',
            heading: 'No cell allocated',
            description:
              'View people who do not currently have a cell allocated having been temporarily moved out of a cell.',
            href: 'http://localhost:3000/no-cell-allocated',
          },
        ],
      })
    })
  })
})
