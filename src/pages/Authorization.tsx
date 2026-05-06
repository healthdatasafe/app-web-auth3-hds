import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import PasswordInput from '../components/PasswordInput'
import PermissionsDialog from '../components/PermissionsDialog'
import Alert from '../components/Alert'
import LanguageSelector from '../components/LanguageSelector'
import { closeOrRedirect } from '../utils'

const ACCEPTED_STATUS = 'ACCEPTED'
const REFUSED_STATUS = 'REFUSED'
const NEED_SIGNIN_STATUS = 'NEED_SIGNIN'

export default function Authorization () {
  const ctx = useAuth()
  const { authService, accessState, user, setUser, pollUrl, appId, updateAccessState, setCheckAppResult } = ctx
  const t = useT()

  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const mfaActivated = !!user.mfaToken

  // Service assets carry the logo URL via service-info; fetch once after mount.
  useEffect(() => {
    let cancelled = false
    authService.assets()
      .then((assets: any) => {
        if (cancelled) return
        assets.setAllDefaults()
        const logo = assets._assets?.['app-web-auth3']?.logo?.url
        if (logo) setLogoUrl(assets.relativeURL(logo))
      })
      .catch(() => { /* logo is optional */ })
    return () => { cancelled = true }
  }, [authService])

  async function handleLogin () {
    if (!user.username.trim() || !password) return
    setError('')
    setSubmitting(true)
    try {
      const trimmed = user.username.trim()
      setUser({ ...user, username: trimmed })

      if (accessState && accessState.status !== NEED_SIGNIN_STATUS) {
        closeOrRedirect(accessState, pollUrl)
        return
      }

      const resolved = await authService.getUsernameForEmail(trimmed)
      await authService.checkUsernameExistence(resolved)
      setUser(prev => ({ ...prev, username: resolved }))

      const connection = await authService.login(resolved, password, appId)
      const token = connection.token || ''
      setUser(prev => ({ ...prev, username: resolved, personalToken: token }))

      if (!accessState) {
        throw new Error('Context access state not defined. Verify that you are performing an Auth request process and either "poll" is specified in query parameters.')
      }

      await doCheckAccess(resolved, token)
    } catch (err: any) {
      if (err.mfaToken) {
        try {
          const resolved = user.username
          await authService.mfaChallenge(resolved, err.mfaToken)
          setUser(prev => ({ ...prev, mfaToken: err.mfaToken }))
        } catch {
          setError(t('mfa.challengeError'))
        }
      } else {
        setError(parseError(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMFA () {
    setError('')
    try {
      const token = await authService.mfaVerify(user.username, user.mfaToken, mfaCode)
      setUser(prev => ({ ...prev, personalToken: token, mfaToken: '' }))
      setMfaCode('')
      await doCheckAccess(user.username, token)
    } catch {
      setError(t('mfa.error'))
      setUser(prev => ({ ...prev, mfaToken: '' }))
    }
  }

  async function doCheckAccess (username: string, personalToken: string) {
    if (!accessState) return
    const checkData: any = {}
    for (const key of ['requestingAppId', 'requestedPermissions', 'deviceName', 'token', 'expireAfter', 'clientData']) {
      const v = (accessState as any)[key]
      if (v != null) {
        checkData[key] = v
      }
    }

    const result = await authService.checkAppAccess(username, personalToken, checkData)

    // Matching access — auto-accept
    if (result.matchingAccess) {
      const acceptedState = {
        status: ACCEPTED_STATUS,
        apiEndpoint: authService.apiEndpointFor(username, result.matchingAccess.token),
        username,
        token: result.matchingAccess.token
      }
      await updateAccessState(acceptedState)
      closeOrRedirect(accessState, pollUrl)
      return
    }

    // Update permissions with checked result
    if (result.checkedPermissions && accessState) {
      ctx.setAccessState({ ...accessState, requestedPermissions: result.checkedPermissions })
    }

    setCheckAppResult(result)
    setShowPermissions(true)
  }

  async function handleAccept () {
    setError('')
    try {
      const { checkAppResult: car } = ctx
      // Delete mismatching access first
      if (car.mismatchingAccess) {
        const del = await authService.deleteAppAccess(user.username, user.personalToken, car.mismatchingAccess.id)
        if (!del.id) throw new Error('Failed removing existing access')
      }

      // Ensure base streams if needed
      const clientData = accessState?.clientData || {}
      if (clientData['app-web-auth:ensureBaseStreams']) {
        const calls = clientData['app-web-auth:ensureBaseStreams'].map((params: any) => ({
          method: 'streams.create',
          params
        }))
        await authService.apiBatchCall(user.username, user.personalToken, calls)
      }

      const requestData: any = {
        permissions: car.checkedPermissions,
        name: accessState?.requestingAppId,
        type: 'app'
      }
      for (const key of ['deviceName', 'token', 'expireAfter']) {
        if ((accessState as any)?.[key] !== undefined) {
          requestData[key] = (accessState as any)[key]
        }
      }
      if (Object.keys(clientData).length > 0) {
        requestData.clientData = clientData
      }

      const appAccess = await authService.createAppAccess(user.username, user.personalToken, requestData)

      const acceptedState = {
        status: ACCEPTED_STATUS,
        apiEndpoint: authService.apiEndpointFor(user.username, appAccess.token),
        username: user.username,
        token: appAccess.token
      }
      await updateAccessState(acceptedState)
      closeOrRedirect(accessState, pollUrl)
    } catch (err: any) {
      setError(parseError(err))
    }
  }

  async function handleRefuse () {
    const refusedState = {
      status: REFUSED_STATUS,
      reasonId: 'REFUSED_BY_USER',
      message: 'The user refused to give access to the requested permissions'
    }
    try {
      await updateAccessState(refusedState)
    } finally {
      closeOrRedirect(accessState, pollUrl)
    }
  }

  // The sign-in form is suppressed once we've moved into the consent step
  // (PermissionsDialog) — keeps the visual hierarchy clean instead of
  // showing a logged-in form behind the modal.
  const showSignInForm = !showPermissions
  const requestingAppId = accessState?.requestingAppId

  return (
    <div className='font-body text-[var(--hds-foreground)]'>
      {/* Permissions consent (separate component, modal). */}
      {showPermissions && accessState && (
        <PermissionsDialog
          accessState={accessState}
          checkAppResult={ctx.checkAppResult}
          onAccept={handleAccept}
          onRefuse={handleRefuse}
        />
      )}

      {/* MFA challenge (modal). */}
      {mfaActivated && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-[var(--hds-card)] p-6 shadow-xl'>
            <h2 className='font-sans text-lg font-semibold text-[var(--hds-card-foreground)]'>
              {t('mfa.title')}
            </h2>
            <p className='mt-1 text-sm text-[var(--hds-muted-foreground)]'>{t('mfa.prompt')}</p>
            <input
              id='mfaCode'
              type='text'
              inputMode='numeric'
              autoComplete='one-time-code'
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder={t('mfa.placeholder')}
              className='mt-4 w-full rounded-lg border border-[var(--hds-input)] bg-[var(--hds-background)] px-3 py-3 text-base tracking-widest tabular-nums outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
            />
            <div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3'>
              <button
                type='button'
                onClick={() => { setUser({ ...user, mfaToken: '' }); setMfaCode('') }}
                className='min-h-11 rounded-lg border border-[var(--hds-border)] px-4 py-2 text-sm font-medium text-[var(--hds-foreground)] hover:bg-[var(--hds-muted)]'
              >
                {t('mfa.cancel')}
              </button>
              <button
                type='button'
                onClick={handleMFA}
                className='min-h-11 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700'
              >
                {t('mfa.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignInForm && (
        <div className='relative mx-auto w-full max-w-md rounded-2xl border border-[var(--hds-border)] bg-[var(--hds-card)] p-6 text-left shadow-sm sm:p-7'>
          {/* Language picker — top-left of the card, mirror of X close. */}
          <LanguageSelector className='absolute left-2 top-2' />

          {/* X close — only renders when there's an auth-request to refuse. */}
          {accessState && (
            <button
              type='button'
              onClick={handleRefuse}
              aria-label={requestingAppId ? t('signin.cancelLinkWith', { appId: requestingAppId }) : t('signin.cancelLink')}
              title={requestingAppId ? t('signin.cancelLinkWith', { appId: requestingAppId }) : t('signin.cancelLink')}
              className='absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--hds-muted-foreground)] transition hover:bg-[var(--hds-muted)] hover:text-[var(--hds-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500/40'
            >
              <CloseIcon />
            </button>
          )}

          {/* Heading — tight, compact. Logo lives at the top of the card. */}
          <header className='mb-4 text-center'>
            {logoUrl && (
              <img
                src={logoUrl}
                alt='Logo'
                className='mx-auto mb-3 h-10 sm:h-12'
              />
            )}
            <h1 className='font-sans text-xl font-semibold tracking-tight text-[var(--hds-foreground)]'>
              {t('signin.title')}
            </h1>
            <p className='mt-1 text-sm text-[var(--hds-muted-foreground)]'>
              {requestingAppId
                ? t('signin.appContextWith', { appId: requestingAppId })
                : t('signin.appContextWithout')}
            </p>
          </header>

          {/* Form */}
          <form onSubmit={e => { e.preventDefault(); handleLogin() }} className='space-y-3'>
            <div>
              <label
                htmlFor='usernameOrEmail'
                className='mb-1 block text-sm font-medium text-[var(--hds-foreground)]'
              >
                {t('signin.usernameLabel')}
              </label>
              <input
                id='usernameOrEmail'
                type='text'
                value={user.username}
                onChange={e => setUser({ ...user, username: e.target.value })}
                autoComplete='username'
                autoCapitalize='off'
                autoCorrect='off'
                spellCheck={false}
                required
                className='w-full rounded-lg border border-[var(--hds-input)] bg-[var(--hds-background)] px-3 py-2.5 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
              />
            </div>

            <PasswordInput value={password} onChange={setPassword} />

            {/* Forgot-password as inline hint right where users would look for it. */}
            <div className='-mt-1 text-right'>
              <Link
                to='/access/reset-password'
                className='text-xs text-[var(--hds-muted-foreground)] underline-offset-2 hover:text-primary-600 hover:underline'
              >
                {t('signin.forgotPassword')}
              </Link>
            </div>

            {error && <Alert error={error} />}

            <button
              id='submitButton'
              type='submit'
              disabled={!user.username.trim() || !password || submitting}
              className='inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {submitting ? t('signin.signingInButton') : t('signin.signInButton')}
            </button>

            {/* Same-width secondary CTA — matches Sign In dimensions, distinct color. */}
            <Link
              to='/access/register'
              className='inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-base font-semibold text-primary-700 transition hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40'
            >
              {t('signin.createAccount')}
            </Link>
          </form>

          {/* Footer: small tertiary text links. */}
          <div className='mt-4 border-t border-[var(--hds-border)] pt-3 text-center text-xs text-[var(--hds-muted-foreground)]'>
            <Link
              to='/access/change-password'
              className='underline-offset-2 hover:text-primary-600 hover:underline'
            >
              {t('signin.changePassword')}
            </Link>
            {ctx.serviceInfo?.support && (
              <>
                <span className='mx-2 text-[var(--hds-border)]' aria-hidden='true'>·</span>
                <a
                  href={ctx.serviceInfo.support}
                  target='_blank'
                  rel='noreferrer'
                  className='underline-offset-2 hover:text-primary-600 hover:underline'
                >
                  {t('signin.helpdeskLink')}
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CloseIcon () {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  )
}

function parseError (err: any): string {
  if (typeof err === 'string') return err
  if (err?.response?.body) {
    const body = err.response.body
    const enc = body.error || body
    let msg = enc.detail || enc.message || 'Unexpected error'
    if (body.error?.data && Array.isArray(body.error.data)) {
      msg += body.error.data.map((e: any) => `<br/>${e.message}`).join('')
    }
    const subs = enc.body || body.errors
    if (Array.isArray(subs)) {
      msg += subs.map((s: any) => `<br/>${s.detail || s.message}`).join('')
    }
    return msg
  }
  return err?.message || 'Unexpected error'
}
