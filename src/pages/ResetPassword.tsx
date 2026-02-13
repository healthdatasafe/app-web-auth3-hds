import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import Alert from '../components/Alert'

export default function ResetPassword () {
  const { authService, user, setUser, isAccessRequest, appId } = useAuth()
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('resetToken')

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const pageTitle = resetToken ? 'Set a new password' : 'Reset password'
  const buttonText = resetToken ? 'Change password' : 'Request password reset'

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

      if (!resetToken) {
        await authService.requestPasswordReset(resolved, appId)
        setShowForm(false)
        setSuccess('We have sent password reset instructions to your e-mail address.')
      } else {
        await authService.resetPassword(resolved, password, resetToken, appId)
        setShowForm(false)
        setSuccess('Your password has been successfully changed.')
      }
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className='text-xl font-semibold mb-4'>{pageTitle}</h1>

      {showForm && (
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

          {resetToken && (
            <PasswordInput value={password} onChange={setPassword} confirmation />
          )}

          <button
            id='submitButton'
            type='submit'
            disabled={!user.username.trim() || submitting}
            className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {buttonText}
          </button>
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

function parseError (err: any): string {
  if (typeof err === 'string') return err
  if (err?.response?.body) {
    const body = err.response.body
    const enc = body.error || body
    return enc.detail || enc.message || 'Unexpected error'
  }
  return err?.message || err?.msg || 'Unexpected error'
}
