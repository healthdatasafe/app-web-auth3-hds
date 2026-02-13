import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AuthService } from '../services/authService'
import type { ServiceInfo, AppCheck } from '../services/authService'

import HDSLib from 'hds-lib'
const { pryv } = HDSLib
const http: any = (pryv.utils as any).superagent

const APP_ID = 'pryv-app-web-auth-3'

export interface AccessState {
  status?: string
  serviceInfo?: any
  code?: number
  key?: string
  requestingAppId?: string
  requestedPermissions?: any[]
  returnURL?: string
  poll_rate_ms?: number
  clientData?: any
  url?: string
  lang?: string
  poll?: string
  pollKey?: string
  oaccessState?: string
  expireAfter?: number
  deviceName?: string
  referer?: string
  username?: string
  token?: string
  apiEndpoint?: string
  reasonId?: string
  message?: string
}

export interface User {
  username: string
  personalToken: string
  mfaToken: string
}

export interface AuthContextValue {
  appId: string
  language: string
  authService: AuthService
  accessState: AccessState | null
  user: User
  checkAppResult: AppCheck
  serviceInfo: ServiceInfo | null
  initialized: boolean
  error: string
  isAccessRequest: boolean
  setUser: React.Dispatch<React.SetStateAction<User>>
  setAccessState: React.Dispatch<React.SetStateAction<AccessState | null>>
  setCheckAppResult: React.Dispatch<React.SetStateAction<AppCheck>>
  setError: React.Dispatch<React.SetStateAction<string>>
  updateAccessState: (state: AccessState) => Promise<number>
  init: () => Promise<void>
  pollUrl: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth (): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function defaultServiceInfoUrl (): string {
  const domain = location.hostname.split('.').slice(1).join('.') || 'pryv.me'
  return 'https://reg.' + domain + '/service/info'
}

export function AuthProvider ({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams()
  const pollUrlParam = searchParams.get('poll') || searchParams.get('pollUrl') || ''
  const serviceInfoUrlParam = searchParams.get('pryvServiceInfoUrl') || ''
  const langParam = searchParams.get('lang') || 'en'
  const oauthState = searchParams.get('oauthState') || ''

  const [language, setLanguage] = useState(langParam)
  const [accessState, setAccessState] = useState<AccessState | null>(
    oauthState ? { oaccessState: oauthState } : null
  )
  const [user, setUser] = useState<User>({ username: '', personalToken: '', mfaToken: '' })
  const [checkAppResult, setCheckAppResult] = useState<AppCheck>({})
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState('')

  const isAccessRequest = !!pollUrlParam
  const pollUrl = pollUrlParam

  // Create AuthService once
  const authServiceRef = useRef<AuthService | null>(null)
  if (!authServiceRef.current) {
    if (isAccessRequest) {
      // Service info will come from poll response
      authServiceRef.current = new AuthService()
    } else {
      authServiceRef.current = new AuthService(serviceInfoUrlParam || defaultServiceInfoUrl())
    }
  }
  const authService = authServiceRef.current

  const updateAccessState = useCallback(async (newState: AccessState): Promise<number> => {
    // Preserve returnURL from original access state
    if (accessState?.returnURL) {
      newState.returnURL = accessState.returnURL
    }
    const res = await http.post(pollUrl).send(newState)
    setAccessState(prev => ({ ...prev, ...newState }))
    if (newState.lang) setLanguage(newState.lang)
    return res.status
  }, [pollUrl, accessState?.returnURL])

  const init = useCallback(async () => {
    if (initialized) return
    try {
      if (isAccessRequest) {
        // Load access state from poll URL
        const res = await http.get(pollUrl).set('accept', 'json')
        const pollData = res.body
        const merged = oauthState ? { ...pollData, oaccessState: oauthState } : pollData
        setAccessState(merged)
        if (merged.lang) setLanguage(merged.lang)
        // Set service info from poll response
        if (merged.serviceInfo) {
          authService.setServiceInfo(merged.serviceInfo)
        }
      }
      const info = await authService.info()
      setServiceInfo(info)
      setInitialized(true)
    } catch (e: any) {
      setError(e.message || 'Failed to initialize')
    }
  }, [initialized, isAccessRequest, pollUrl, oauthState, authService])

  useEffect(() => {
    init()
  }, [init])

  const value: AuthContextValue = {
    appId: APP_ID,
    language,
    authService,
    accessState,
    user,
    checkAppResult,
    serviceInfo,
    initialized,
    error,
    isAccessRequest,
    setUser,
    setAccessState,
    setCheckAppResult,
    setError,
    updateAccessState,
    init,
    pollUrl
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
