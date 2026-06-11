# Changelog

## [Unreleased]

### Changed
- Production deployment moved to `account.hds.ngo` (2026-06-11; was `account.datasafe.dev`, now retired). Platform auth URLs (defaultAuthUrl, passwordResetPageURL, trustedAuthUrls) updated accordingly.

### Fixed
- `redirectExternal` now URL-encodes all appended params (2026-06-10). Unencoded `prYvauthUrl` (a full URL) leaked its `&key=…&poll=…` into the calling app's URL as top-level params; pryv-lib-js strips only `prYv*` params when building the next returnURL, so a sign-out → sign-in in the same tab redirected to an unroutable `/&key=…` URL and the login was lost.

### Added
- New Relic Browser instrumentation (2026-06-10): `newrelic-snippet.html` / `.prod.html` (entities `hds-dev-app-web-auth3-hds` / `hds-prod-app-web-auth3-hds`), build-time injection via `newrelicBrowser()` vite plugin (same pattern as hds-webapp); `deploy-prod.sh` builds with `NR_ENV=prod`. (BUGS B-2026-05-29-1)


### Changed
- **2026-05-26** — Error display unified across all 5 pages (sign-in / register / reset / change-password / authorization). New shared `src/parseError.ts` renders Pryv error envelopes consistently: walks `error.data` whether array (per-field validation messages like password format) or object (echoed payload from `invalid-request-structure`), appends the error `id`, and falls back to a JSON dump for unknown shapes so the UI is never silent on an unexpected error.
- **2026-05-26** — `requestCmcScopeUpdate` now throws on failure (instead of returning `{ error }`), matching the rest of `authService` and letting the unified error-display pipeline handle it uniformly.
- **2026-05-26** — `Authorization.tsx` `handleAccept` now checks per-result errors on the `ensureBaseStreams` batch call (via new `throwIfBatchErrors` export). Pryv batch responses return HTTP 200 even when individual ops fail; the prior code silently swallowed those.
- **2026-05-06** — Hostnames flipped to `demo-account.datasafe.dev` (demo) and `account.datasafe.dev` (prod), replacing `demo-auth.datasafe.dev` / `auth.datasafe.dev`. Source-of-truth tracked in `dev-deploy/config/apps.yml § app-web-auth3-hds` and `pryv.open-pryv-io.auth-urls`. Plan: `_plans/55-app-web-auth3-rewrite-and-pwd-reset-atwork/`.
- **2026-05-06** — Hardened `scripts/deploy.sh` and `scripts/deploy-prod.sh`: reset to `origin/gh-pages` (resp. `origin/main`) before build, `.nojekyll` touch, post-build sanity check (assert `index.html`, `404.html`, `CNAME`, `assets/index-*.js`, expected CNAME content).

### Fixed
- **2026-05-26** — `closeOrRedirect` no longer navigates to `/access/self` (a 404) when the auth flow's `returnURL` is the sentinel value `self` (or `self#`). It now closes the popup, matching the empty / `'false'` branch.
- **2026-05-26** — Account-creation password-format errors now show the specific message (e.g. "Password should have between 5 and 23 characters") instead of only the generic "Parameters' format is invalid" wrapper.
- **2026-05-26** — Permission-acceptance failures (e.g. server rejecting a `streamId`) now display the underlying server error to the user instead of silently freezing the UI.
- **2026-05-26** — Added `@tailwindcss/typography` as a devDependency so `npm run build` succeeds end-to-end (the symlinked `hds-style` consumes it). Auto-fixed pre-existing semi-style lint errors in `src/global.d.ts` + `src/loadSettings.ts`.
- **2026-05-06** — React rewrite (`feat/react-rewrite`) was runtime-broken end-to-end against `pryv-lib@3.0.3` because `pryv.utils.superagent` was dropped in v3. Migrated 16 HTTP call sites in `src/services/authService.ts` from superagent's chained API to `pryv.utils.fetchPost` / `fetchGet` (raw `fetch` for `DELETE`). Also `src/context/AuthContext.tsx` (poll-URL GET in `init()` + POST in `updateAccessState()`). Plus a null-guard in `src/pages/Authorization.tsx:82-87` so `clientData: null` from the auth-request payload isn't forwarded to `/accesses/check-app` (the Pryv API rejects null with `400 invalid-parameters-format`).

## [1.1.0] - 2025-05-13

### Fixed
- Terms & conditions handling

### Changed
- Added creation of needed streams on registration
- Migrated from `rec.la` to `backloop.dev`

## [1.0.0] - 2022-03-28

### Fixed
- Language not being forwarded at user creation

### Changed
- Security dependency updates (moment, express, qs, url-parse, follow-redirects, shelljs, etc.)

## [0.9.0] - 2020-10-22

### Added
- Docker image build and CI pipeline
- Change password page

### Fixed
- MFA login error handling (stripped error fields)
- Error message forwarding

### Changed
- Migrated Docker registry

## [0.8.0] - 2020-09-18

### Added
- System streams support for registration
- Service info discovery configuration

### Changed
- Registration behavior adapts to platform version
- Removed user login after registration (moved server-side)
- Published for Open Pryv.io

### Fixed
- `returnURL` being lost during auth flow

## [0.7.0] - 2020-04-28

### Added
- Referer support for auth requests
- GitHub Pages fork deployment guide

### Fixed
- `pollUrl` parameter naming (`poll` vs `pollUrl`)
- Syntax and param cleanup in auth flow

## [0.6.0] - 2020-04-06

### Changed
- Migrated to lib-js NPM version
- Bumped Node requirement to 12
- Refactored Pryv to JS-lib extension pattern

### Added
- License file
- Unit and TestCafe documentation links

## [0.5.0] - 2020-04-03

### Changed
- Removed accepted/refused states from flow
- Return `apiEndpoint` with accept state
- Simplified error handling

### Fixed
- Tests adapted for new prop context initialization
- Updated snapshots

## [0.4.0] - 2019-12-06

### Added
- DNS-less mode support
- MFA (multi-factor authentication) integration

### Fixed
- Default domain handling

## [0.3.0] - 2019-11-01

### Fixed
- Various bug fixes (return URL, permissions)

### Changed
- Made email optional for registration

## [0.2.0] - 2018-11-15

### Added
- Client data display with Markdown support
- Requesting app ID display
- `pollKey`-based auth parameter retrieval
- Stream name display (instead of ID) in permissions
- Multiple submit prevention

### Changed
- Improved async flow with error catching
- Better permission dialog styling

## [0.1.0] - 2018-10-08

### Added
- Single-page auth flow refactoring
- Service info integration for hostings
- OAuth settings support
- Cancel action and app closing flow
- 404 component
- Router history mode (removed hashbang)
- Publish scripts and deployment instructions

## [0.0.1] - 2018-09-05

### Added
- Initial release (forked from Pryv app-web-auth3)
- Vue.js authentication webapp
- Login, registration, and password reset flows
- Authorization flow with permissions dialog
- Hosting selection
- E2E tests with TestCafe
- Unit tests with Jest
- ESLint configuration
