import { UUID } from 'crypto'
import type { AuditEvent } from '@ministryofjustice/hmpps-audit-client'
import { CaseLoad } from '../../data/prisonApiClient'
import type { UserDetails } from '../../services/userService'

export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    referrerUrl?: string
    returnToService?: string
  }
}

export declare global {
  namespace Express {
    interface User extends Partial<UserDetails> {
      token: string
      authSource: string
      userId?: string
      userUuid?: UUID // This is a UUID created by HMPPS Auth upon first user login that is unique to the user across all
      activeCaseLoad?: CaseLoad
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      auditEvent?: Omit<AuditEvent, 'what'>
      user: Express.User
    }
  }
}
