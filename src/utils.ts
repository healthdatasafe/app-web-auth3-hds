import type { AccessState } from './context/AuthContext'

/**
 * Close popup or redirect to returnURL — preserves the behavior
 * from the Vue 2 close_or_redirect.js
 */
export function closeOrRedirect (accessState: AccessState | null, pollUrl: string): void {
  let returnUrl = accessState?.returnURL
  // `'self'` (and the `#`-suffixed variant from pryv-lib-js) means "no
  // redirect, the calling app polls" — treating it as a path turns it into
  // `/access/self?…` which 404s on React Router. Match the
  // empty / 'false' branch: just close the popup.
  if (!returnUrl || returnUrl === 'false' || returnUrl === 'self' || returnUrl === 'self#') {
    window.close()
    return
  }

  if (!returnUrl.endsWith('?')) {
    returnUrl += '?'
  }

  if (accessState?.oaccessState) {
    let pollKey = ''
    if (accessState.key) {
      pollKey = `&code=${accessState.key}`
    }
    returnUrl += `state=${accessState.oaccessState}${pollKey}&poll=${pollUrl}`
  } else {
    returnUrl += `prYvpoll=${pollUrl}`
    // Deprecated: pass access state params as query string
    if (accessState) {
      for (const [key, val] of Object.entries(accessState)) {
        if (typeof val === 'string' || typeof val === 'number') {
          returnUrl += `&prYv${key}=${val}`
        }
      }
    }
  }
  location.href = returnUrl
}
