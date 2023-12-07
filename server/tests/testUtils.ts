import UserService from '../services/userService'

export class MockUserService extends UserService {
  constructor() {
    super(undefined)
  }

  async getUserRoles(_token: string) {
    return ['CELL_MOVE']
  }
}

export default MockUserService
