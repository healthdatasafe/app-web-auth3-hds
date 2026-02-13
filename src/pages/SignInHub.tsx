import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/Alert'

export default function SignInHub () {
  const { authService, user, setUser, serviceInfo } = useAuth()

  const [error, setError] = useState('')

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!user.username.trim()) return
    setError('')

    try {
      const trimmed = user.username.trim()
      setUser({ ...user, username: trimmed })

      const resolved = await authService.getUsernameForEmail(trimmed)
      await authService.checkUsernameExistence(resolved)
      setUser(prev => ({ ...prev, username: resolved }))

      location.href = authService.apiEndpointFor(resolved)
    } catch (err: any) {
      setError(parseError(err))
    }
  }

  return (
    <div>
      <h1 className='text-xl font-semibold mb-4'>Sign-in hub</h1>

      <form onSubmit={handleSubmit} className='space-y-3'>
        <div>
          <label htmlFor='usernameOrEmail' className='block text-sm font-medium text-neutral-700 mb-1'>
            Username or email
          </label>
          <input
            id='usernameOrEmail'
            type='text'
            value={user.username}
            onChange={e => setUser({ ...user, username: e.target.value })}
            required
            className='w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none'
          />
        </div>

        <button
          id='submitButton'
          type='submit'
          disabled={!user.username.trim()}
          className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Go to my homepage
        </button>
      </form>

      <hr className='my-4 border-neutral-200' />
      <Link to='/access/register' className='text-primary-600 hover:underline font-medium'>
        New to {serviceInfo?.name || 'the platform'}? Create an account
      </Link>

      <Alert error={error} />
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
