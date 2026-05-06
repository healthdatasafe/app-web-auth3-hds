/**
 * AuthService — typed replacement for PryvServiceExtension.js
 *
 * Uses HDSService (extends pryv.Service) from hds-lib for service info resolution,
 * and pryv 3 native methods where available.
 */
import HDSLib from 'hds-lib'
const { pryv, HDSService } = HDSLib
const { fetchPost, fetchGet } = pryv.utils as any

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
  server: string
}

function isVersionGte (v1: string, v2: string): boolean {
  const p1 = v1.split('.').map(Number)
  const p2 = v2.split('.').map(Number)
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] ?? 0
    const b = p2[i] ?? 0
    if (a > b) return true
    if (a < b) return false
  }
  return true
}

export class AuthService {
  private service: any

  constructor (serviceInfoUrl?: string) {
    this.service = new HDSService(serviceInfoUrl)
  }

  /** Set service info directly (used when poll response contains serviceInfo) */
  setServiceInfo (serviceInfo: any): void {
    this.service.setServiceInfo(serviceInfo)
  }

  /** Get full service info */
  async info (): Promise<ServiceInfo> {
    return await this.service.info()
  }

  /** Get service info synchronously (after info() has been called) */
  infoSync (): ServiceInfo {
    return this.service.infoSync()
  }

  /** Build API endpoint for a user */
  apiEndpointFor (username: string, token?: string): string {
    return pryv.Service.buildAPIEndpoint(this.infoSync() as any, username, token)
  }

  /** Get service assets */
  async assets (): Promise<any> {
    return await this.service.assets()
  }

  // ---- Auth / Login ----

  /**
   * Login using pryv 3 native fetch. Returns a Connection on success, throws
   * with `mfaToken` attached when MFA is required.
   */
  async login (username: string, password: string, appId: string): Promise<any> {
    const apiEndpoint = await this.service.apiEndpointFor(username)
    const headers: Record<string, string> = {}
    if (!pryv.utils.isBrowser()) {
      headers.Origin = (await this.info()).register
    }
    const { response, body } = await fetchPost(
      apiEndpoint + 'auth/login',
      { username, password, appId },
      headers
    )

    if (response.ok && body?.token) {
      return new pryv.Connection(
        pryv.Service.buildAPIEndpoint(await this.info() as any, username, body.token),
        this.service
      )
    }

    if (body?.mfaToken) {
      const mfaError: any = new Error('MFA required')
      mfaError.mfaToken = body.mfaToken
      throw mfaError
    }
    if (body?.error?.message) {
      throw new Error(body.error.message)
    }
    throw new Error('Invalid login response')
  }

  // ---- MFA ----

  async mfaChallenge (username: string, mfaToken: string): Promise<void> {
    await fetchPost(
      this.apiEndpointFor(username) + 'mfa/challenge',
      {},
      { Authorization: mfaToken }
    )
  }

  async mfaVerify (username: string, mfaToken: string, code: string): Promise<string> {
    const { body } = await fetchPost(
      this.apiEndpointFor(username) + 'mfa/verify',
      { code },
      { Authorization: mfaToken }
    )
    return body.token
  }

  // ---- Access management ----

  async checkAppAccess (username: string, personalToken: string, checkData: any): Promise<AppCheck> {
    const { body } = await fetchPost(
      this.apiEndpointFor(username) + 'accesses/check-app',
      checkData,
      { Authorization: personalToken }
    )
    return body
  }

  async createAppAccess (username: string, personalToken: string, requestData: any): Promise<AppAccess> {
    const { body } = await fetchPost(
      this.apiEndpointFor(username) + 'accesses',
      requestData,
      { Authorization: personalToken }
    )
    return body.access
  }

  async deleteAppAccess (username: string, personalToken: string, accessId: string): Promise<any> {
    const response = await fetch(
      this.apiEndpointFor(username) + 'accesses/' + accessId,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: personalToken
        },
        body: JSON.stringify({ id: accessId })
      }
    )
    const body = await response.json()
    return body.accessDeletion
  }

  /** Batch API call (replaces userApiBatchCall) */
  async apiBatchCall (username: string, personalToken: string, calls: any[]): Promise<any> {
    const { body } = await fetchPost(
      this.apiEndpointFor(username),
      calls,
      { Authorization: personalToken }
    )
    return body
  }

  // ---- Registration ----

  async getAvailableHostings (): Promise<HostingSelectionItem[]> {
    const { body } = await fetchGet(this.infoSync().register + 'hostings')
    return parseHostings(body)
  }

  async createUser (
    availableCore: string,
    username: string,
    password: string,
    email: string,
    hosting: string,
    lang: string,
    appId: string,
    invitation?: string,
    referer?: string
  ): Promise<NewUser> {
    const version = this.infoSync().version
    let res
    if (version && isVersionGte(version, '1.6.0')) {
      res = await fetchPost(
        new URL('users', availableCore).href,
        {
          appId,
          username,
          password,
          email,
          hosting,
          language: lang || 'en',
          invitationToken: invitation || 'enjoy',
          referer
        }
      )
    } else {
      res = await fetchPost(
        this.infoSync().register + 'user',
        {
          appid: appId,
          username,
          password,
          email,
          hosting,
          languageCode: lang || 'en',
          invitationtoken: invitation || 'enjoy',
          referer
        }
      )
    }
    return res.body
  }

  async checkUsernameExistence (username: string): Promise<string> {
    const { body } = await fetchPost(
      this.infoSync().register + username + '/server',
      {}
    )
    return body.server
  }

  async getUsernameForEmail (usernameOrEmail: string): Promise<string> {
    if (!usernameOrEmail.includes('@')) return usernameOrEmail
    const { body } = await fetchGet(this.infoSync().register + usernameOrEmail + '/uid')
    return body.uid
  }

  // ---- Password management ----

  async requestPasswordReset (username: string, appId: string): Promise<number> {
    const { response } = await fetchPost(
      this.apiEndpointFor(username) + 'account/request-password-reset',
      { appId, username }
    )
    return response.status
  }

  async resetPassword (username: string, newPassword: string, resetToken: string, appId: string): Promise<number> {
    const { response } = await fetchPost(
      this.apiEndpointFor(username) + 'account/reset-password',
      { username, newPassword, appId, resetToken }
    )
    return response.status
  }

  async changePassword (username: string, oldPassword: string, newPassword: string, personalToken: string): Promise<number> {
    const { response } = await fetchPost(
      this.apiEndpointFor(username) + 'account/change-password',
      { oldPassword, newPassword },
      { Authorization: personalToken }
    )
    return response.status
  }
}

/** Parse hostings API response into flat selection list */
function parseHostings (data: any): HostingSelectionItem[] {
  const selection: HostingSelectionItem[] = []
  const regions = data.regions || {}
  for (const regionKey of Object.keys(regions)) {
    const zones = regions[regionKey].zones || {}
    for (const zoneKey of Object.keys(zones)) {
      const hostings = zones[zoneKey].hostings || {}
      for (const hostingKey of Object.keys(hostings)) {
        const h = hostings[hostingKey]
        let text = h.name || hostingKey
        if (h.description) text = `${text} (${h.description})`
        selection.push({
          value: hostingKey,
          text,
          description: h.description || '',
          availableCore: h.availableCore
        })
      }
    }
  }
  return selection
}
