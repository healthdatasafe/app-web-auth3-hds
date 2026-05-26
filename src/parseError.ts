/**
 * parseError — turn anything thrown / returned-as-error into an HTML-safe
 * string the `<Alert>` component can render.
 *
 * Guarantees:
 *  - Always returns a non-empty string (never silently swallows an error).
 *  - Surfaces nested per-field messages from the Pryv `error.data[]` array
 *    (e.g. password-format, invitation-format).
 *  - Surfaces the offending payload from a `error.data` *object* (Pryv
 *    sometimes echoes the rejected input — e.g. the bad `streamId` in
 *    `invalid-request-structure`).
 *  - Includes the Pryv error `id` as a `<code>[…]</code>` tag so users
 *    can paste a specific identifier into a bug report.
 *  - For truly unknown shapes, returns a dump of the error so the user
 *    sees *something* instead of a frozen UI.
 *
 * Output is HTML — the `<Alert>` component renders via
 * `dangerouslySetInnerHTML`. All dynamic content is HTML-escaped before
 * interpolation; only the framing markup (`<br/>`, `<code>`) is raw.
 *
 * ## Contract examples (input → expected output substring)
 *
 *  SHAPE A — Pryv `error.data` as per-field array (e.g. F-2026-05-26-1
 *  password-format):
 *    err.response.body = {
 *      error: {
 *        id: 'invalid-parameters-format',
 *        message: "The parameters' format is invalid.",
 *        data: [{ message: 'Password should have between 5 and 23 characters',
 *                 path: '#/password', param: 'password' }]
 *      }
 *    }
 *    → "The parameters' format is invalid.<br/>• Password should have… <code>(#/password)</code> <code>[invalid-parameters-format]</code>"
 *
 *  SHAPE B — Pryv `error.data` as echoed-payload object (e.g. F-2026-05-26-2
 *  colon-prefixed streamId rejected by `POST /accesses`):
 *    err.response.body = {
 *      error: {
 *        id: 'invalid-request-structure',
 *        message: "Invalid 'permission' parameter, forbidden chartacter(s) in streamId ':_cmc:apps:hds-collector'.",
 *        data: { defaultName: 'HDS CMC (collector scope)', level: 'manage', streamId: ':_cmc:apps:hds-collector' }
 *      }
 *    }
 *    → "Invalid 'permission' parameter…<br/><code>defaultName: HDS CMC…, level: manage, streamId: :_cmc:apps:hds-collector</code> <code>[invalid-request-structure]</code>"
 *
 *  Plain `Error` (e.g. local logic throw):
 *    new Error('Unknown email: alice@example.com')
 *    → "Unknown email: alice@example.com"
 *
 *  Unknown shape (last-resort fallback — must never return empty):
 *    { weird: 'object', no: 'message' }
 *    → "Unknown error (<code>Object</code>): <code>{…JSON dump…}</code>"
 */

function escapeHtml (s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch] as string))
}

/**
 * Render a Pryv error envelope ({id, message, data, ...}) to HTML.
 * Returns empty string if the envelope is missing/empty.
 */
function envelopeToHtml (envelope: any): string {
  if (!envelope || typeof envelope !== 'object') return ''

  const parts: string[] = []
  const topMsg = envelope.detail || envelope.message
  if (topMsg) parts.push(escapeHtml(String(topMsg)))

  if (Array.isArray(envelope.data)) {
    // Per-field validation errors (e.g. `invalid-parameters-format` with
    // a list of `{code, message, path, param}` entries).
    for (const sub of envelope.data) {
      if (!sub || typeof sub !== 'object') continue
      const subMsg = sub.detail || sub.message
      if (!subMsg) continue
      const where = sub.path || sub.param
      const tag = where ? ` <code>(${escapeHtml(String(where))})</code>` : ''
      parts.push(`<br/>• ${escapeHtml(String(subMsg))}${tag}`)
    }
  } else if (envelope.data && typeof envelope.data === 'object') {
    // The server sometimes echoes the rejected payload as an object
    // (e.g. `invalid-request-structure` on `accesses.create` returns
    // `data: {defaultName, level, streamId}` — the offending permission).
    // No nested .message, so compact-print scalar fields.
    const compact = Object.entries(envelope.data)
      .filter(([, v]) => v != null && typeof v !== 'object')
      .map(([k, v]) => `${escapeHtml(String(k))}: ${escapeHtml(String(v))}`)
      .join(', ')
    if (compact) parts.push(`<br/><code>${compact}</code>`)
  }

  if (envelope.id) {
    parts.push(` <code>[${escapeHtml(String(envelope.id))}]</code>`)
  }
  return parts.join('')
}

export function parseError (err: any): string {
  if (typeof err === 'string') return err || 'Unknown error'

  if (err && typeof err === 'object') {
    // Pryv HTTP error: err.response.body = { error: { id, message, data } }
    const body = err.response?.body
    if (body && typeof body === 'object') {
      let html = envelopeToHtml(body.error) || envelopeToHtml(body)

      // Legacy sub-error arrays: body.errors[] or body.error.body[]
      const subs = body.errors || body.error?.body
      if (Array.isArray(subs)) {
        for (const s of subs) {
          const text = s?.detail || s?.message
          if (text) html += `<br/>• ${escapeHtml(String(text))}`
        }
      }
      if (html) return html
    }

    // Plain Error / batch-result error wrapped by throwIfApiError.
    const baseMsg = err.message || err.msg
    if (baseMsg) {
      const idTag = err.id ? ` <code>[${escapeHtml(String(err.id))}]</code>` : ''
      return escapeHtml(String(baseMsg)) + idTag
    }

    // Last-resort: dump whatever we have. The point is to never freeze
    // the UI silently — the user must see SOMETHING actionable.
    try {
      const name = (err.name && String(err.name)) || err.constructor?.name || 'Error'
      const dump = JSON.stringify(err, Object.getOwnPropertyNames(err)).slice(0, 300)
      return `Unknown error (<code>${escapeHtml(name)}</code>): <code>${escapeHtml(dump)}</code>`
    } catch {
      return 'Unknown error'
    }
  }

  return 'Unknown error'
}
