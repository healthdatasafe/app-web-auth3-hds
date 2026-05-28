/**
 * AuthService — thin wrapper over pryv 3.0.4 + HDSService.
 *
 * Almost every method delegates to upstream `pryv.Service` (Tier 1 / Tier 2
 * conveniences shipped in pryv 3.0.4). The few authenticated user-actions
 * (Tier 3) go through `connection.api([...])` since the maintainer dropped
 * the per-action wrappers in favour of the existing batch primitive.
 *
 * Errors: `pryv.Service` throws `PryvError` (with `.id` / `.status` / `.response`)
 * on non-2xx; `service.login()` throws `MfaRequiredError` (with `.mfaToken`)
 * when the core needs MFA. Pages render `err.message` directly.
 */
import HDSLib, { cmc } from 'hds-lib'
const { pryv, HDSService } = HDSLib

export interface Permission {
  streamId: string
  level: 'read' | 'contribute' | 'manage'
  defaultName?: string
  name?: string
}

export interface AppAccess {
  id: string
  type: 'app'
  permissions: Permission[]
  expires?: number
  token: string
  /**
   * Plan 59 Phase 5c: CMC counterparty accesses carry plugin-managed
   * markers under `clientData.cmc`. The Authorization.tsx mismatchingAccess
   * flow reads `clientData.cmc.counterparty.remoteCollectorStreamId` to
   * route the scope-update request via `cmc.requestScopeUpdate`.
   */
  clientData?: {
    cmc?: {
      role?: string
      counterparty?: {
        username?: string
        host?: string
        remoteCollectorStreamId?: string
        remoteChatStreamId?: string
      }
      [k: string]: unknown
    }
    [k: string]: unknown
  }
}

export interface AppCheck {
  checkedPermissions?: Permission[]
  matchingAccess?: AppAccess
  /**
   * An existing app access whose permissions don't match what the app is
   * now requesting. Two reconciliation paths exist, dispatched by
   * `reconcileMismatchingAccess()` based on `clientData.cmc.role`:
   *
   *  - **CMC counterparty access** (`clientData.cmc.role === 'counterparty'`):
   *    plugin-managed permissions, gated by the patient's consent. Routes
   *    through `cmc.requestScopeUpdate`; handshake completes with the
   *    existing (lesser) access; the patient acts later.
   *  - **Plain app access** (the common case): user-owned. Routes through
   *    `accesses.update`; permissions take effect immediately, token +
   *    apiEndpoint preserved.
   */
  mismatchingAccess?: AppAccess
}

export interface ReconcileParams {
  permissions: Permission[]
  clientData?: Record<string, unknown>
  deviceName?: string
  expireAfter?: number
}

export interface ReconcileResult {
  access: AppAccess
  /**
   * `true` when the new permissions won't take effect immediately — the
   * server has accepted a scope-update request that another party must
   * accept (e.g. CMC counterparty: patient's consent). The handshake
   * completes with the existing (lesser) access in the meantime.
   */
  requiresAsyncConsent: boolean
}

export interface ServiceInfo {
  version: string
  register: string
  access: string
  api: string
  name: string
  home: string
  support: string
  terms: string
}

export interface HostingSelectionItem {
  availableCore?: string
  value: string
  text: string
  description: string
}

export interface NewUser {
  username: string
  apiEndpoint: string
}

export class AuthService {
  private service: any

  constructor (serviceInfoUrl?: string) {
    this.service = new HDSService(serviceInfoUrl)
  }

  setServiceInfo (serviceInfo: any): void {
    this.service.setServiceInfo(serviceInfo)
  }

  async info (): Promise<ServiceInfo> {
    return await this.service.info()
  }

  infoSync (): ServiceInfo {
    return this.service.infoSync()
  }

  apiEndpointFor (username: string, token?: string): string {
    return pryv.Service.buildAPIEndpoint(this.infoSync() as any, username, token)
  }

  async assets (): Promise<any> {
    return await this.service.assets()
  }

  // ---- Auth / Login ----

  async login (username: string, password: string, appId: string): Promise<any> {
    return await this.service.login(username, password, appId)
  }

  async mfaChallenge (username: string, mfaToken: string): Promise<void> {
    await this.service.mfaChallenge(username, mfaToken)
  }

  async mfaVerify (username: string, mfaToken: string, code: string): Promise<string> {
    const connection = await this.service.mfaVerify(username, mfaToken, code)
    return connection.token
  }

  // ---- Username / email resolution ----

  async getUsernameForEmail (usernameOrEmail: string): Promise<string> {
    if (!usernameOrEmail.includes('@')) return usernameOrEmail
    const uid = await this.service.userIdForEmail(usernameOrEmail)
    if (!uid) throw new Error('Unknown email: ' + usernameOrEmail)
    return uid
  }

  async checkUsernameExistence (username: string): Promise<void> {
    const exists = await this.service.userExists(username)
    if (!exists) throw new Error('Unknown user: ' + username)
  }

  // ---- Registration ----

  async getAvailableHostings (): Promise<HostingSelectionItem[]> {
    const items = await this.service.flatHostings()
    return items.map((h: any) => ({
      value: h.key,
      text: h.description ? `${h.name} (${h.description})` : (h.name || h.key),
      description: h.description || '',
      availableCore: h.availableCore
    }))
  }

  async createUser (
    _availableCore: string,
    username: string,
    password: string,
    email: string,
    hosting: string,
    lang: string,
    appId: string,
    invitation?: string,
    referer?: string
  ): Promise<NewUser> {
    return await this.service.createUser({
      username,
      password,
      email,
      hosting,
      language: lang || 'en',
      appId,
      invitationToken: invitation || 'enjoy',
      referer
    })
  }

  // ---- Password management ----

  async requestPasswordReset (username: string, appId: string): Promise<void> {
    await this.service.requestPasswordReset(username, appId)
  }

  async resetPassword (username: string, newPassword: string, resetToken: string, appId: string): Promise<void> {
    await this.service.resetPassword(username, newPassword, resetToken, appId)
  }

  async changePassword (username: string, oldPassword: string, newPassword: string, personalToken: string): Promise<void> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'account.changePassword', params: { oldPassword, newPassword } }
    ])
    throwIfApiError(res)
  }

  // ---- Access management (Tier 3 — via connection.api) ----

  async checkAppAccess (username: string, personalToken: string, checkData: any): Promise<AppCheck> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'accesses.checkApp', params: checkData }
    ])
    throwIfApiError(res)
    return res
  }

  async createAppAccess (username: string, personalToken: string, requestData: any): Promise<AppAccess> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'accesses.create', params: requestData }
    ])
    throwIfApiError(res)
    return res.access
  }

  async deleteAppAccess (username: string, personalToken: string, accessId: string): Promise<any> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'accesses.delete', params: { id: accessId } }
    ])
    throwIfApiError(res)
    return res.accessDeletion
  }

  /**
   * Raw `accesses.update`. Returns `{access}` on success or `{error}` on
   * failure (does not throw). Callers branch on `res.error?.id` (e.g.
   * `'stale-resource'`).
   */
  async updateAppAccess (
    username: string,
    personalToken: string,
    accessId: string,
    update: any
  ): Promise<any> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'accesses.update', params: { id: accessId, update } }
    ])
    return res
  }

  /**
   * Reconcile an existing access whose permissions diverged from what the
   * app now wants. Dispatches based on who controls the access's permissions:
   *
   *  - CMC counterparty (`clientData.cmc.role === 'counterparty'`): permissions
   *    are plugin-managed and gated by the patient's consent. Calls
   *    `cmc.requestScopeUpdate` (writes a `consent/scope-request-cmc` event).
   *    Returns the EXISTING access; the calling app keeps working with the
   *    current (lesser) scope until the patient accepts.
   *  - Plain app access: the authenticated user owns the access. Calls
   *    `accesses.update` directly; new permissions take effect immediately.
   *    Token + apiEndpoint preserved (only the composite id advances).
   */
  async reconcileMismatchingAccess (
    username: string,
    personalToken: string,
    mismatchingAccess: AppAccess,
    params: ReconcileParams
  ): Promise<ReconcileResult> {
    // accesses.checkApp adds extras (name, defaultName) to checkedPermissions
    // for display purposes; both accesses.update and cmc.requestScopeUpdate
    // reject anything beyond the canonical {streamId, level} / {feature, setting} shape.
    const cleanedPermissions = params.permissions.map((p: any) => {
      if (p.streamId) return { streamId: p.streamId, level: p.level }
      if (p.feature) return { feature: p.feature, setting: p.setting }
      return p
    })

    const cmcRole = mismatchingAccess.clientData?.cmc?.role
    if (cmcRole === 'counterparty') {
      const collectorStreamId = mismatchingAccess.clientData?.cmc?.counterparty?.remoteCollectorStreamId
      if (!collectorStreamId) {
        throw new Error(
          'CMC counterparty access missing clientData.cmc.counterparty.remoteCollectorStreamId; cannot route scope-update.'
        )
      }
      await this.requestCmcScopeUpdate(username, personalToken, {
        collectorStreamId,
        newPermissions: cleanedPermissions,
      })
      return { access: mismatchingAccess, requiresAsyncConsent: true }
    }

    const update: any = { permissions: cleanedPermissions }
    if (params.clientData && Object.keys(params.clientData).length > 0) {
      update.clientData = params.clientData
    }
    if (params.deviceName !== undefined) update.deviceName = params.deviceName
    if (params.expireAfter !== undefined) update.expireAfter = params.expireAfter

    const res = await this.updateAppAccess(username, personalToken, mismatchingAccess.id, update)
    if (res.error) {
      const err: any = new Error(res.error.message || 'Failed updating existing access')
      err.id = res.error.id
      err.response = { body: { error: res.error } }
      throw err
    }
    return { access: res.access, requiresAsyncConsent: false }
  }

  /**
   * Plan 59 Phase 5c: propose a scope update on a CMC counterparty access.
   *
   * Writes a `consent/scope-request-cmc` event on `:_cmc:apps:hds-collector:<doctor-path>:collectors:<patient-slug>`
   * (the collectorStreamId). The patient sees the request on their hds-webapp
   * Tasks UI and accepts/refuses; on accept, the CMC plugin's
   * `accessesUpdateHook` updates the counterparty access permissions
   * automatically.
   *
   * This replaces Plan 58's `accesses.update` flow (`updateAppAccess`) — the
   * doctor cannot directly mutate CMC counterparty access permissions; the
   * scope-update protocol mediates it via the patient.
   *
   * The auth handshake completes with the EXISTING (lesser) permissions.
   * The doctor's app continues working with current scope until the patient
   * acts; the doctor sees a "scope-update pending" indicator until then.
   */
  async requestCmcScopeUpdate (
    username: string,
    personalToken: string,
    params: {
      collectorStreamId: string
      newPermissions: Permission[]
      message?: Record<string, string>
      expires?: number
    }
  ): Promise<{ scopeRequestEventId: string }> {
    const connection = this.connectionFor(username, personalToken)
    return await cmc.requestScopeUpdate(connection, params)
  }

  async apiBatchCall (username: string, personalToken: string, calls: any[]): Promise<any> {
    const connection = this.connectionFor(username, personalToken)
    return await connection.api(calls)
  }

  // ---- Internals ----

  private connectionFor (username: string, token: string): any {
    return new pryv.Connection(this.apiEndpointFor(username, token), this.service)
  }
}

function throwIfApiError (res: any): void {
  if (res?.error) {
    const err: any = new Error(res.error.message || 'Pryv API error')
    err.id = res.error.id
    err.response = { body: { error: res.error } }
    throw err
  }
}

/**
 * Throws on the first per-result error in a Pryv batch response, with the
 * full server envelope attached for `parseError` to render. Use this on any
 * `connection.api([...])` / `apiBatchCall` result whose errors would
 * otherwise be silently dropped — Pryv batch calls return HTTP 200 even
 * when individual operations fail, so a caller that ignores the result
 * array swallows the failure.
 *
 * Pass `{ ignoreCodes }` to tolerate specific Pryv error ids — useful for
 * idempotent provisioning batches (e.g. ensureBaseStreams' `streams.create`
 * calls, where `'item-already-exists'` is the expected benign outcome on
 * any subsequent grant against an account that was already provisioned).
 */
export function throwIfBatchErrors (results: any[], opts?: { ignoreCodes?: string[] }): void {
  if (!Array.isArray(results)) return
  const ignore = new Set(opts?.ignoreCodes ?? [])
  for (const r of results) {
    if (r?.error && ignore.has(r.error.id)) continue
    throwIfApiError(r)
  }
}
