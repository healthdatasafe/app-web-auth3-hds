import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import Alert from '../components/Alert'

export default function ChangePassword () {
  const { authService, user, setUser, appId } = useAuth()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!user.username.trim() || !oldPassword || !newPassword) return
    setError('')
    setSubmitting(true)

    try {
      const trimmed = user.username.trim()
      setUser({ ...user, username: trimmed })

      const resolved = await authService.getUsernameForEmail(trimmed)
      await authService.checkUsernameExistence(resolved)
      setUser(prev => ({ ...prev, username: resolved }))

      // Login first to get a personal token
      const connection = await authService.login(resolved, oldPassword, appId)
      const token = connection.token || ''

      // Change password
      await authService.changePassword(resolved, oldPassword, newPassword, token)
      setShowForm(false)
      setSuccess('Your password has been successfully changed.')
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className='text-xl font-semibold mb-4'>Change password</h1>

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

          <PasswordInput
            value={oldPassword}
            onChange={setOldPassword}
            label='Current password'
            id='oldPassword'
          />

          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            label='New password'
            id='newPassword'
            confirmation
          />

          <button
            id='submitButton'
            type='submit'
            disabled={!user.username.trim() || !oldPassword || !newPassword || submitting}
            className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Change password
          </button>
        </form>
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
