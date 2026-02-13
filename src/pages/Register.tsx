import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import Alert from '../components/Alert'
import type { HostingSelectionItem } from '../services/authService'

export default function Register () {
  const { authService, user, setUser, isAccessRequest, language, appId, accessState, serviceInfo } = useAuth()

  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [hosting, setHosting] = useState('')
  const [hostings, setHostings] = useState<HostingSelectionItem[]>([])
  const [newUser, setNewUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    authService.getAvailableHostings()
      .then(items => {
        setHostings(items)
        if (items.length > 0) setHosting(items[0].value)
      })
      .catch(e => setError(parseError(e)))
  }, [authService])

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!user.username.trim() || !password || !hosting) return
    setError('')
    setSubmitting(true)

    try {
      // Generate random email if not provided
      let finalEmail = email
      if (!finalEmail || finalEmail.length === 0) {
        finalEmail = randomString(20) + '@pryv.io'
      }

      // Find available core for selected hosting
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
      setSuccess(`New user successfully created: ${result.username}.`)

      if (!isAccessRequest) {
        location.href = authService.apiEndpointFor(result.username)
      }
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className='text-xl font-semibold mb-4'>Register a new user</h1>

      {!newUser && (
        <form id='registerForm' onSubmit={handleSubmit} className='space-y-3'>
          <div>
            <label htmlFor='email' className='block text-sm font-medium text-neutral-700 mb-1'>
              E-mail
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Optional (required for password reset)'
              className='w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none'
            />
          </div>

          <div>
            <label htmlFor='username' className='block text-sm font-medium text-neutral-700 mb-1'>
              Username
            </label>
            <input
              id='username'
              type='text'
              value={user.username}
              onChange={e => setUser({ ...user, username: e.target.value })}
              required
              className='w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none'
            />
          </div>

          <PasswordInput value={password} onChange={setPassword} confirmation />

          <div>
            <label htmlFor='hosting' className='block text-sm font-medium text-neutral-700 mb-1'>
              Hosting
            </label>
            <select
              id='hosting'
              value={hosting}
              onChange={e => setHosting(e.target.value)}
              required
              className='w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none'
            >
              {hostings.map(h => (
                <option key={h.value} value={h.value}>{h.text}</option>
              ))}
            </select>
          </div>

          <div className='flex gap-3 pt-1'>
            <button
              id='submitButton'
              type='submit'
              disabled={!user.username.trim() || !password || !hosting || submitting}
              className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Create
            </button>
            <button
              id='clearButton'
              type='reset'
              onClick={() => { setEmail(''); setPassword(''); setHosting(hostings[0]?.value || ''); setUser({ ...user, username: '' }) }}
              className='px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50'
            >
              Clear
            </button>
          </div>

          {serviceInfo?.terms && (
            <p className='text-sm text-neutral-500'>
              By registering you agree with our{' '}
              <a href={serviceInfo.terms} target='_blank' rel='noreferrer' className='text-primary-600 underline'>
                terms and conditions
              </a>.
            </p>
          )}
        </form>
      )}

      {isAccessRequest && (
        <>
          <hr className='my-4 border-neutral-200' />
          <Link to='/access/auth' className='text-primary-600 hover:underline font-medium'>
            Go to Sign in
          </Link>
        </>
      )}

      <Alert error={error} success={success} />
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
