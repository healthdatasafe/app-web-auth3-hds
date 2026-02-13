/**
 * AuthService — typed replacement for PryvServiceExtension.js
 *
 * Uses HDSService (extends pryv.Service) from hds-lib for service info resolution,
 * and pryv 3 native methods where available.
 */
import HDSLib from 'hds-lib'
const { pryv, HDSService } = HDSLib
// superagent is available at runtime but not in pryv's type declarations
const http: any = (pryv.utils as any).superagent

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
   * Login using pryv 3 native service.login()
   * Returns the connection, or throws with mfaToken if MFA required.
   */
  async login (username: string, password: string, appId: string): Promise<any> {
    const apiEndpoint = await this.service.apiEndpointFor(username)
    try {
      const headers: any = { accept: 'json' }
      const originHeader = (await this.info()).register
      if (!pryv.utils.isBrowser()) {
        headers.Origin = originHeader
      }
      const res = await http
        .post(apiEndpoint + 'auth/login')
        .set(headers)
        .send({ username, password, appId })

      if (!res.body.token) {
        throw new Error('Invalid login response')
      }
      return new pryv.Connection(
        pryv.Service.buildAPIEndpoint(await this.info() as any, username, res.body.token),
        this.service
      )
    } catch (e: any) {
      if (e.response?.body) {
        const body = e.response.body
        if (body.error?.message) {
          throw new Error(body.error.message)
        }
        if (body.mfaToken) {
          const mfaError: any = new Error('MFA required')
          mfaError.mfaToken = body.mfaToken
          throw mfaError
        }
      }
      throw e
    }
  }

  // ---- MFA ----

  async mfaChallenge (username: string, mfaToken: string): Promise<void> {
    await http
      .post(this.apiEndpointFor(username) + 'mfa/challenge')
      .set('accept', 'json')
      .set('Authorization', mfaToken)
      .send({})
  }

  async mfaVerify (username: string, mfaToken: string, code: string): Promise<string> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'mfa/verify')
      .set('accept', 'json')
      .set('Authorization', mfaToken)
      .send({ code })
    return res.body.token
  }

  // ---- Access management ----

  async checkAppAccess (username: string, personalToken: string, checkData: any): Promise<AppCheck> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'accesses/check-app')
      .set('accept', 'json')
      .set('Authorization', personalToken)
      .send(checkData)
    return res.body
  }

  async createAppAccess (username: string, personalToken: string, requestData: any): Promise<AppAccess> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'accesses')
      .set('accept', 'json')
      .set('Authorization', personalToken)
      .send(requestData)
    return res.body.access
  }

  async deleteAppAccess (username: string, personalToken: string, accessId: string): Promise<any> {
    const res = await http
      .delete(this.apiEndpointFor(username) + 'accesses/' + accessId)
      .set('accept', 'json')
      .set('Authorization', personalToken)
      .send({ id: accessId })
    return res.body.accessDeletion
  }

  /** Batch API call (replaces userApiBatchCall) */
  async apiBatchCall (username: string, personalToken: string, calls: any[]): Promise<any> {
    const res = await http
      .post(this.apiEndpointFor(username))
      .set('accept', 'json')
      .set('Authorization', personalToken)
      .send(calls)
    return res.body
  }

  // ---- Registration ----

  async getAvailableHostings (): Promise<HostingSelectionItem[]> {
    const res = await http
      .get(this.infoSync().register + 'hostings')
      .set('accept', 'json')
    return parseHostings(res.body)
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
      res = await http
        .post(new URL('users', availableCore).href)
        .set('accept', 'json')
        .send({
          appId,
          username,
          password,
          email,
          hosting,
          language: lang || 'en',
          invitationToken: invitation || 'enjoy',
          referer
        })
    } else {
      res = await http
        .post(this.infoSync().register + 'user')
        .set('accept', 'json')
        .send({
          appid: appId,
          username,
          password,
          email,
          hosting,
          languageCode: lang || 'en',
          invitationtoken: invitation || 'enjoy',
          referer
        })
    }
    return res.body
  }

  async checkUsernameExistence (username: string): Promise<string> {
    const res = await http
      .post(this.infoSync().register + username + '/server')
      .set('accept', 'json')
      .send({})
    return res.body.server
  }

  async getUsernameForEmail (usernameOrEmail: string): Promise<string> {
    if (!usernameOrEmail.includes('@')) return usernameOrEmail
    const res = await http
      .get(this.infoSync().register + usernameOrEmail + '/uid')
      .set('accept', 'json')
    return res.body.uid
  }

  // ---- Password management ----

  async requestPasswordReset (username: string, appId: string): Promise<number> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'account/request-password-reset')
      .set('accept', 'json')
      .send({ appId, username })
    return res.status
  }

  async resetPassword (username: string, newPassword: string, resetToken: string, appId: string): Promise<number> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'account/reset-password')
      .set('accept', 'json')
      .send({ username, newPassword, appId, resetToken })
    return res.status
  }

  async changePassword (username: string, oldPassword: string, newPassword: string, personalToken: string): Promise<number> {
    const res = await http
      .post(this.apiEndpointFor(username) + 'account/change-password')
      .set('accept', 'json')
      .set('Authorization', personalToken)
      .send({ oldPassword, newPassword })
    return res.status
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
