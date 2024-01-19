import UserService from '../services/userService'

export class MockUserService extends UserService {
  constructor() {
    super(undefined, undefined)
  }

  async getUserRoles(_token: string) {
    return ['CELL_MOVE']
  }
}

export const defaultServices = {
  userService: new MockUserService(),
}

export default {
  defaultServices,
  MockUserService,
}
