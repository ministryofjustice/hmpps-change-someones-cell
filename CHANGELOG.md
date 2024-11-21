# Change log

**November 21st 2024** - Move to node 22

Node 22 is now LTS. Notes [here](https://nodejs.org/en/blog/announcements/v22-release-announce)

See PR [#474](https://github.com/ministryofjustice/hmpps-template-typescript/pull/474)


**November 18th 2024** - Moving away from csurf and to csrf-sync

[csurf](https://www.npmjs.com/package/csurf) has been deprecated for some time and this removes that dependency and implements the [synchronizer token pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#transmissing-csrf-tokens-in-synchronized-patterns) using [csrf-sync](https://www.npmjs.com/package/csrf-sync).

**Note:** Previously csurf used to generate new tokens on every request. The new library generates tokens once per session which is preferrable due to the extra calls to redis that per-request would generate. It is possible to force a refresh/revocation of a token by explicitly calling: `req.csrfToken(true)`  

See PR [#481](https://github.com/ministryofjustice/hmpps-template-typescript/pull/481)
---
