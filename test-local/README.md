# `test-local/` — local-dev test fixtures for `app-web-auth3-hds`

This directory holds **fixtures and helper scripts** for exercising the React rewrite's pages locally — not unit tests, not e2e tests, just curated entry-point URLs and scenario payloads that make it easy to load each route in a meaningful state and observe the UX.

The intended driver is a Claude + Chrome-MCP loop: Claude generates the entry URL via the helper scripts, navigates to it, and the user reports back what they see (layout glitches, missing copy, error-message wording, etc.).

For the test plan itself (matrix, scope, what we're covering), see `_plans/55-app-web-auth3-rewrite-and-pwd-reset-atwork/PLAN-UI.md`.

## Prereqs

```bash
# from app-web-auth3-hds/app-web-auth3-hds/
npm install      # if not done already
npm run dev      # starts vite on https://auth.backloop.dev:4443/
```

The dev server picks up `serviceInfoUrl` from the `loadSettings.ts` fallback (`https://demo.datasafe.dev/reg/service/info`) when no `dist/settings.json` is present. To override per-shell:

```bash
SERVICE_INFO_URL='https://reg.api.datasafe.dev/service/info' npm run dev   # point at prod core (read-only flows!)
```

## Layout

```
test-local/
├── README.md               (this file)
├── scripts/
│   ├── new-auth-request.sh   create a fresh auth request on demo, print local-dev URL
│   └── fresh-throwaway-user.sh   register a unique throwaway user on demo, print credentials
└── fixtures/
    └── scenarios.json      named scenarios (permissions + clientData shapes) consumed by new-auth-request.sh
```

## Quick reference — entry URLs

These cover the **standalone** routes (no auth-request prereq):

| Route                          | Local URL                                                    | Notes |
| ------------------------------ | ------------------------------------------------------------ | ----- |
| Reset-password (request reset) | `https://auth.backloop.dev:4443/access/reset-password`       | enter username/email → POST `request-password-reset` |
| Reset-password (set new pw)    | `https://auth.backloop.dev:4443/access/reset-password?resetToken=<TOKEN>` | needs a real token from a reset email |
| Register                       | `https://auth.backloop.dev:4443/access/register`             | hostings dropdown loads from demo register |
| Change-password                | `https://auth.backloop.dev:4443/access/change-password`      | needs valid creds (old pw + new pw) |
| Sign-in hub                    | `https://auth.backloop.dev:4443/access/signin`               | resolves username → redirect to apiEndpoint |
| Legacy `.html` redirect (any)  | `…/access/<page>.html?<original-query>`                      | should rewrite to `/access/<page>` and preserve query |

For the **authorization flow** (popup mode with poll URL), the auth-request must be created first via `scripts/new-auth-request.sh`.

## scripts/new-auth-request.sh

Create a fresh auth request against the demo register service and print the local-dev URL the popup would normally open:

```bash
./test-local/scripts/new-auth-request.sh                            # default scenario (basic-diary-read)
./test-local/scripts/new-auth-request.sh with-consent-md            # clientData carrying a markdown consent message
./test-local/scripts/new-auth-request.sh manage-all                 # broad permission set, consent dialog stress-test
./test-local/scripts/new-auth-request.sh with-return-url            # returnURL set so closeOrRedirect path is exercised
./test-local/scripts/new-auth-request.sh --service prod with-consent-md   # prod register (read-only flows!)
```

Output is a single line — the URL to load in the browser, e.g.:

```
https://auth.backloop.dev:4443/access/auth?lang=en&key=<X>&requestingAppId=test-auth-app&poll=https%3A%2F%2Fdemo.datasafe.dev%2Freg%2Faccess%2F<X>&poll_rate_ms=1000&serviceInfo=https%3A%2F%2Fdemo.datasafe.dev%2Freg%2Fservice%2Finfo
```

The auth request is a fresh `key` each invocation; old keys expire (Pryv-side `passwordResetRequestMaxAge` in `override-config.yml`, default 1 h).

## scripts/fresh-throwaway-user.sh

Register a unique throwaway user on demo and print credentials. Use this to avoid burning the real test accounts (`perki05demo`/`perki05prod`) for repeated login-flow runs:

```bash
./test-local/scripts/fresh-throwaway-user.sh
# username: tauth26050614281234
# password: TestAuth26050614281234!
# email:    perkiz+tauth26050614281234@gmail.com
# apiEndpoint: https://demo.datasafe.dev/tauth26050614281234/
```

The username/password get printed only — pipe the output if you want to save them. Throwaway users live forever on demo until a manual cleanup; that's fine, they have no PII.

## fixtures/scenarios.json

Source of truth for the named scenarios. Add new ones by appending to the JSON (one object per scenario). Schema:

```json
{
  "name": "with-consent-md",
  "requestingAppId": "test-auth-app",
  "requestedPermissions": [{ "streamId": "diary", "level": "manage", "defaultName": "Diary" }],
  "languageCode": "en",
  "returnURL": null,
  "clientData": {
    "app-web-auth:description": {
      "type": "text/markdown",
      "content": "**Welcome!** This test app would like access to your *Diary*."
    }
  }
}
```

`clientData` follows the legacy/upstream convention — `app-web-auth:description` (without the `3:`) with `.content` rendered via `marked.parse` in `PermissionsDialog.tsx`. Two `type` shapes are exercised:

| `type`          | Rendering | Fixture |
| --------------- | --------- | ------- |
| `text/markdown` | parsed as markdown (bold / italic / list / link supported) | `with-consent-md` |
| `note/txt`      | plain text — renders as a single `<p>` block via marked.parse | `with-consent-plaintext` |

Both must work; the renderer is type-agnostic (does not branch on `.type`). The `with-consent-plaintext` fixture exists to keep the plain-text path covered if the renderer is ever refactored to gate on `.type`.

## Notes for new contributors

- Don't commit auth tokens or reset tokens that came back from real flows — they're short-lived but still credentials.
- Test fixtures should target the **demo** Pryv core. Prod is opt-in via `--service prod` and only for read-only flows (sign-in hub, register-with-rollback). Don't run reset/change flows on prod test accounts unless deliberately verifying a prod-level fix (and document the trigger in the relevant plan).
- Keep `scenarios.json` tidy — one named entry per recognisable test case. If a scenario grows beyond ~20 lines of clientData, factor it into its own file under `fixtures/`.
