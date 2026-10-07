import type { AuditService, SubjectType } from '@ministryofjustice/hmpps-audit-client'
import type { Request, RequestHandler } from 'express'

import logger from '../../logger'

/**
 * Requests that are not page views: prisoner images.
 * Health checks and static resources are mounted earlier in app.ts so never reach here.
 */
const notPageViews = [/^\/app\/images\//]

/** Prisoner numbers appear in the path of every audited page */
const prisonerNumberInPath = /\/prisoner\/([A-Z][0-9]{4}[A-Z]{2})\b/

/** HMPPS Audit rejects subject ids longer than this */
const maxSubjectIdLength = 80

type Subject = { subjectType: SubjectType; subjectId?: string }

/**
 * Audits page views to HMPPS Audit.
 *
 * Emits VIEW_PAGE_ACCESS_ATTEMPT once the response closes – covering redirects, errors and
 * requests refused downstream by the authorisation middleware – and VIEW_PAGE when a page
 * renders successfully.
 *
 * Mount after authentication but before authorisation, so that refused requests are still
 * recorded as attempts.
 */
export default function auditPageView(auditService: AuditService): RequestHandler {
  return (req, res, next) => {
    const who = res.locals.user?.username
    if (!who || notPageViews.some(pattern => pattern.test(req.originalUrl))) {
      next()
      return
    }

    res.locals.auditEvent = {
      who,
      correlationId: req.id,
      details: { pageUrl: req.originalUrl },
      ...subjectOfRequest(req),
    }

    res.prependOnceListener('close', () => {
      logPageView(auditService, res.locals.auditEvent, true)
    })

    type ResRender = (view: string, options?: object, callback?: (err: Error, html: string) => void) => void
    const resRender = res.render as ResRender
    res.render = (view: string, options?: object) => {
      resRender.call(res, view, options, (err: Error, html: string) => {
        if (err) {
          next(err)
          return
        }
        // send the page first: auditing must never delay or break rendering
        res.send(html)
        logPageView(auditService, res.locals.auditEvent)
      })
    }

    next()
  }
}

function subjectOfRequest(req: Request): Subject {
  const prisonerNumber = req.originalUrl.match(prisonerNumberInPath)?.[1]
  if (prisonerNumber) {
    return { subjectType: 'PRISONER_ID', subjectId: prisonerNumber }
  }
  const searchTerm = typeof req.query?.keywords === 'string' ? req.query.keywords : undefined
  if (searchTerm) {
    return { subjectType: 'SEARCH_TERM', subjectId: searchTerm.substring(0, maxSubjectIdLength) }
  }
  return { subjectType: 'NOT_APPLICABLE' }
}

function logPageView(auditService: AuditService, auditEvent: Express.Locals['auditEvent'], isAttempt = false): void {
  if (!auditEvent) return

  const event = { ...auditEvent, what: isAttempt ? 'VIEW_PAGE_ACCESS_ATTEMPT' : 'VIEW_PAGE' }

  // auditing must not be able to break page rendering, so never throw
  auditService.logAuditEvent(event, { throwOnError: false, logOnError: true }).catch(error => {
    logger.error(error, 'Failed to audit page view')
  })
}
