import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import PasswordInput from '../components/PasswordInput'
import Alert from '../components/Alert'
import LanguageSelector from '../components/LanguageSelector'
import type { HostingSelectionItem } from '../services/authService'

export default function Register () {
  const { authService, user, setUser, isAccessRequest, language, appId, accessState, serviceInfo } = useAuth()
  const t = useT()

  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [hosting, setHosting] = useState('')
  const [hostings, setHostings] = useState<HostingSelectionItem[]>([])
  const [newUser, setNewUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    authService.getAvailableHostings()
      .then(items => {
        if (cancelled) return
        setHostings(items)
        if (items.length > 0) setHosting(items[0].value)
      })
      .catch(e => { if (!cancelled) setError(parseError(e)) })
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

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!user.username.trim() || !password || !hosting) return
    setError('')
    setSubmitting(true)
    try {
      // Generate a random email if the field is empty (kept for parity with
      // the legacy app — Pryv requires an email server-side).
      let finalEmail = email
      if (!finalEmail || finalEmail.length === 0) {
        finalEmail = randomString(20) + '@pryv.io'
      }

      const selected = hostings.find(h => h.value === hosting)
      const availableCore = selected?.availableCore || ''

      let referer: string | undefined
      if (accessState) {
        referer = (accessState as any).referer || accessState.requestingAppId
      }

      const result = await authService.createUser(
        availableCore,
        user.username.trim(),
        password,
        finalEmail,
        hosting,
        language,
        appId,
        undefined,
        referer
      )
      setNewUser(result)

      if (!isAccessRequest) {
        // Standalone registration → redirect to user's apiEndpoint root.
        location.href = authService.apiEndpointFor(result.username)
      }
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='font-body text-[var(--hds-foreground)]'>
      <div className='relative mx-auto w-full max-w-md rounded-2xl border border-[var(--hds-border)] bg-[var(--hds-card)] p-6 text-left shadow-sm sm:p-7'>
        <LanguageSelector className='absolute left-2 top-2' />

        <header className='mb-4 text-center'>
          {logoUrl && (
            <img src={logoUrl} alt='Logo' className='mx-auto mb-3 h-10 sm:h-12' />
          )}
          <h1 className='font-sans text-xl font-semibold tracking-tight text-[var(--hds-foreground)]'>
            {newUser ? t('register.successTitle') : t('register.title')}
          </h1>
          <p className='mt-1 text-sm text-[var(--hds-muted-foreground)]'>
            {newUser
              ? t('register.successBody', { username: newUser.username })
              : t('register.intro')}
          </p>
        </header>

        {!newUser && (
          <form onSubmit={handleSubmit} className='space-y-3'>
            <div>
              <label
                htmlFor='username'
                className='mb-1 block text-sm font-medium text-[var(--hds-foreground)]'
              >
                {t('register.usernameLabel')}
              </label>
              <input
                id='username'
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
              <p className='mt-1 text-xs text-[var(--hds-muted-foreground)]'>
                {t('register.usernameHint')}
              </p>
            </div>

            <div>
              <label
                htmlFor='email'
                className='mb-1 block text-sm font-medium text-[var(--hds-foreground)]'
              >
                {t('register.emailLabel')}
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete='email'
                className='w-full rounded-lg border border-[var(--hds-input)] bg-[var(--hds-background)] px-3 py-2.5 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
              />
              <p className='mt-1 text-xs text-[var(--hds-muted-foreground)]'>
                {t('register.emailHint')}
              </p>
            </div>

            <PasswordInput value={password} onChange={setPassword} confirmation />

            {/* Hosting select — only render when there's a real choice. Demo
                + prod each have a single hosting today, so the dropdown is
                pure noise; the value is still set internally from the first
                returned entry. */}
            {hostings.length > 1 && (
              <div>
                <label
                  htmlFor='hosting'
                  className='mb-1 block text-sm font-medium text-[var(--hds-foreground)]'
                >
                  {t('register.hostingLabel')}
                </label>
                <select
                  id='hosting'
                  value={hosting}
                  onChange={e => setHosting(e.target.value)}
                  required
                  className='w-full rounded-lg border border-[var(--hds-input)] bg-[var(--hds-background)] px-3 py-2.5 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'
                >
                  {hostings.map(h => (
                    <option key={h.value} value={h.value}>{h.text}</option>
                  ))}
                </select>
              </div>
            )}

            {error && <Alert error={error} />}

            <button
              id='submitButton'
              type='submit'
              disabled={!user.username.trim() || !password || !hosting || submitting}
              className='inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {submitting ? t('register.submitting') : t('register.submit')}
            </button>

            {serviceInfo?.terms && (
              <p className='text-center text-xs text-[var(--hds-muted-foreground)]'>
                {t('register.termsPrefix')}{' '}
                <a
                  href={serviceInfo.terms}
                  target='_blank'
                  rel='noreferrer'
                  className='font-medium text-primary-600 underline-offset-2 hover:underline'
                >
                  {t('register.termsLink')}
                </a>
                .
              </p>
            )}
          </form>
        )}

        {/* Success state — when in an auth-flow context, show a continue
            button back to /access/auth so the user can sign in with the
            new credentials. (Standalone register hard-redirects above.) */}
        {newUser && isAccessRequest && (
          <Link
            to='/access/auth'
            className='inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40'
          >
            {t('register.successContinueAuth')}
          </Link>
        )}

        <div className='mt-4 border-t border-[var(--hds-border)] pt-3 text-center text-xs text-[var(--hds-muted-foreground)]'>
          {t('register.alreadyHaveAccount')}{' '}
          <Link
            to={isAccessRequest ? '/access/auth' : '/access/signin'}
            className='font-medium underline-offset-2 hover:text-primary-600 hover:underline'
          >
            {t('register.signInLink')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function randomString (length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function parseError (err: any): string {
  if (typeof err === 'string') return err
  if (err?.response?.body) {
    const body = err.response.body
    const enc = body.error || body
    return enc.detail || enc.message || 'Unexpected error'
  }
  return err?.message || err?.msg || 'Unexpected error'
}
