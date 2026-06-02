import type { AccessState } from './context/AuthContext'

/**
 * Close the auth window iff it was opened by a script (`window.opener`
 * present — typical browser-app popup pattern). Otherwise leave the page
 * rendered so the caller can show an outcome screen — user-opened tabs
 * cannot be closed by `window.close()` per browser spec.
 */
export function attemptCloseOrStay (): 'closed' | 'stayed' {
  if (window.opener != null) {
    window.close()
    return 'closed'
  }
  return 'stayed'
}

/**
 * Redirect to the calling app's `returnURL`, appending poll / oauthState
 * params per the access-flow protocol. Does not return — navigation
 * starts synchronously.
 */
export function redirectExternal (returnURL: string, accessState: AccessState | null, pollUrl: string): void {
  let url = returnURL
  if (!url.endsWith('?')) url += '?'

  if (accessState?.oaccessState) {
    let pollKey = ''
    if (accessState.key) {
      pollKey = `&code=${accessState.key}`
    }
    url += `state=${accessState.oaccessState}${pollKey}&poll=${pollUrl}`
  } else {
    url += `prYvpoll=${pollUrl}`
    // Deprecated: pass access state params as query string
    if (accessState) {
      for (const [k, v] of Object.entries(accessState)) {
        if (typeof v === 'string' || typeof v === 'number') {
          url += `&prYv${k}=${v}`
        }
      }
    }
  }
  location.href = url
}

/**
 * Finalise the auth flow by either closing the window, redirecting to the
 * calling app's `returnURL`, or — for user-opened tabs in the no-redirect
 * branch — staying put so the caller can render an outcome screen.
 *
 * Returns `'stayed'` only when the page must remain visible: caller renders
 * `<AuthOutcome>`. Otherwise the page is closing / navigating away and the
 * caller can leave its render path alone.
 */
export function finaliseAuthFlow (accessState: AccessState | null, pollUrl: string): 'closed' | 'stayed' {
  const returnURL = accessState?.returnURL
  // `'self'` (and the `#`-suffixed variant from pryv-lib-js) means "no
  // redirect, the calling app polls". Same handling as empty / 'false'.
  if (!returnURL || returnURL === 'false' || returnURL === 'self' || returnURL === 'self#') {
    return attemptCloseOrStay()
  }
  redirectExternal(returnURL, accessState, pollUrl)
  return 'closed'
}
