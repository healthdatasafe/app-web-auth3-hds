import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import PasswordInput from '../components/PasswordInput'
import Alert from '../components/Alert'
import LanguageSelector from '../components/LanguageSelector'

export default function ResetPassword () {
  const { authService, user, setUser, isAccessRequest, appId } = useAuth()
  const t = useT()
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('resetToken')

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  // Logo from service assets — same fetch pattern as Authorization.
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

  // Mode = 'set' when there's a resetToken in the URL (user clicked the
  // link in the reset email); 'request' otherwise.
  const mode: 'request' | 'set' = resetToken ? 'set' : 'request'

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!user.username.trim()) return
    setError('')
    setSubmitting(true)
    try {
      const trimmed = user.username.trim()
      setUser({ ...user, username: trimmed })

      const resolved = await authService.getUsernameForEmail(trimmed)
      await authService.checkUsernameExistence(resolved)
      setUser(prev => ({ ...prev, username: resolved }))

      if (mode === 'request') {
        await authService.requestPasswordReset(resolved, appId)
      } else {
        await authService.resetPassword(resolved, password, resetToken!, appId)
      }
      setDone(true)
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
            {done ? t(`reset.${mode}.successTitle`) : t(`reset.${mode}.title`)}
          </h1>
          <p className='mt-1 text-sm text-[var(--hds-muted-foreground)]'>
            {done ? t(`reset.${mode}.successBody`) : t(`reset.${mode}.intro`)}
          </p>
        </header>

        {!done && (
          <form onSubmit={handleSubmit} className='space-y-3'>
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

            {mode === 'set' && (
              <PasswordInput value={password} onChange={setPassword} confirmation />
            )}

            {error && <Alert error={error} />}

            <button
              id='submitButton'
              type='submit'
              disabled={!user.username.trim() || (mode === 'set' && !password) || submitting}
              className='inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {submitting ? t(`reset.${mode}.submitting`) : t(`reset.${mode}.submit`)}
            </button>
          </form>
        )}

        {/* Footer: back link. After success in 'set' mode we point at sign-in;
            after success in 'request' mode we keep the back-to-signin link too
            so the user can try signing in once the email arrives. */}
        <div className='mt-4 border-t border-[var(--hds-border)] pt-3 text-center text-xs text-[var(--hds-muted-foreground)]'>
          <Link
            to={isAccessRequest ? '/access/auth' : '/access/signin'}
            className='underline-offset-2 hover:text-primary-600 hover:underline'
          >
            {t('reset.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  )
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
