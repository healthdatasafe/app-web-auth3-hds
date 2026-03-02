# Manual Testing — app-web-auth3-hds React Rewrite

**Branch**: `feat/react-rewrite`
**Status**: Ready for manual testing

## Setup

- [ ] `npm run setup` (or `npm install`)
- [ ] `npm run dev` — starts on http://localhost:5173

## Auth Flow (main flow)

- [ ] Open via `pryv.Browser.setupAuth()` from doctor-dashboard (popup mode)
- [ ] Sign in with valid credentials → consent dialog appears
- [ ] Verify permissions list is displayed correctly
- [ ] Accept permissions → popup closes, calling app receives token
- [ ] Repeat sign in → auto-accept (matching access detected)
- [ ] Sign in and Reject permissions → popup closes, calling app gets REFUSED
- [ ] Cancel button → refused state, popup closes
- [ ] returnURL redirect works (when returnURL is set instead of popup)

## MFA

- [ ] Sign in with MFA-enabled account → MFA dialog appears
- [ ] Enter valid MFA code → proceeds to consent
- [ ] Enter invalid MFA code → error shown
- [ ] Cancel MFA dialog → returns to sign-in form

## Registration (/access/register)

- [ ] Hosting dropdown loads and populates
- [ ] Create account with valid data → success message
- [ ] Create account without email → random email generated, still succeeds
- [ ] Duplicate username → error shown
- [ ] "Go to Sign in" link works (when in auth/poll context)
- [ ] Terms & conditions link points to correct URL

## Reset Password (/access/reset-password)

- [ ] Request reset with valid username → success message about email sent
- [ ] Request reset with email address → resolves to username, sends email
- [ ] Open reset link with `?resetToken=...` → password fields appear
- [ ] Set new password with valid token → success
- [ ] Set new password with expired/invalid token → error

## Change Password (/access/change-password)

- [ ] Change password with correct old password → success
- [ ] Change password with wrong old password → error

## Sign-in Hub (/access/signin)

- [ ] Enter valid username → redirects to user's API endpoint
- [ ] Enter invalid username → error
- [ ] "Create an account" link works

## General

- [ ] Query params persist when navigating between pages
- [ ] Legacy .html URLs redirect correctly (e.g. /access/access.html → /access/auth)
- [ ] Logo loads from service assets
- [ ] Service info (support link, terms link) displays when available
- [ ] App works at backloop.dev SSL URL
- [ ] `npm run build` → deploy dist/ and verify production build works
- [ ] Responsive layout looks OK in popup-sized window (~400px wide)

## When done

- [ ] Merge `feat/react-rewrite` into master
- [ ] Update plan1.md Done section
- [ ] Archive detailed plan if one exists
