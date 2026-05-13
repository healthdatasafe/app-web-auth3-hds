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
import HDSLib from 'hds-lib'
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
}

export interface AppCheck {
  checkedPermissions?: Permission[]
  matchingAccess?: AppAccess
  mismatchingAccess?: AppAccess
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
   * Plan 66 / Plan 58 Phase 5: update an existing access in place rather than
   * delete + create. Used by Authorization.tsx when `accesses.checkApp` returns
   * a `mismatchingAccess` (an app access exists with different permissions/clientData).
   *
   * Returns `{ access }` on success or `{ error }` on failure. Stale-resource
   * (409) is surfaced as `error.id === 'stale-resource'` for the caller to
   * detect and retry.
   */
  async updateAppAccess (username: string, personalToken: string, accessId: string, update: any): Promise<any> {
    const connection = this.connectionFor(username, personalToken)
    const [res] = await connection.api([
      { method: 'accesses.update', params: { id: accessId, update } }
    ])
    return res
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
