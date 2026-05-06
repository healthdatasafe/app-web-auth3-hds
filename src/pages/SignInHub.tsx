import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import Alert from '../components/Alert'
import LanguageSelector from '../components/LanguageSelector'

export default function SignInHub () {
  const { authService, user, setUser } = useAuth()
  const t = useT()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

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

      // Hard navigation — leaves this app entirely.
      location.href = authService.apiEndpointFor(resolved)
    } catch (err: any) {
      setError(parseError(err))
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
            {t('signinhub.title')}
          </h1>
          <p className='mt-1 text-sm text-[var(--hds-muted-foreground)]'>
            {t('signinhub.intro')}
          </p>
        </header>

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

          {error && <Alert error={error} />}

          <button
            id='submitButton'
            type='submit'
            disabled={!user.username.trim() || submitting}
            className='inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-base font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {submitting ? t('signinhub.submitting') : t('signinhub.submit')}
          </button>

          <Link
            to='/access/register'
            className='inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-base font-semibold text-primary-700 transition hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40'
          >
            {t('signin.createAccount')}
          </Link>
        </form>
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
