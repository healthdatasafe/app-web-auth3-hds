import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import PermissionsDialog from '../components/PermissionsDialog'
import Alert from '../components/Alert'
import { closeOrRedirect } from '../utils'

const ACCEPTED_STATUS = 'ACCEPTED'
const REFUSED_STATUS = 'REFUSED'
const NEED_SIGNIN_STATUS = 'NEED_SIGNIN'

export default function Authorization () {
  const ctx = useAuth()
  const { authService, accessState, user, setUser, pollUrl, appId, updateAccessState, setCheckAppResult } = ctx

  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const mfaActivated = !!user.mfaToken

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
          setError('Failed to perform MFA challenge.')
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
      setError('MFA verification failed.')
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

  return (
    <div>
      <h1 className='text-xl font-semibold mb-4'>Sign in</h1>

      {showPermissions && accessState && (
        <PermissionsDialog
          accessState={accessState}
          checkAppResult={ctx.checkAppResult}
          onAccept={handleAccept}
          onRefuse={handleRefuse}
        />
      )}

      {/* MFA Dialog */}
      {mfaActivated && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-5'>
            <h2 className='text-lg font-semibold mb-4'>MFA verification</h2>
            <input
              id='mfaCode'
              type='text'
              value={mfaCode}
              onChange={e => setMfaCode(e.target.value)}
              placeholder='MFA code'
              className='w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm mb-4 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none'
            />
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => { setUser({ ...user, mfaToken: '' }); setMfaCode('') }}
                className='px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50'
              >
                Cancel
              </button>
              <button
                onClick={handleMFA}
                className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700'
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); handleLogin() }} className='space-y-3'>
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

        <PasswordInput value={password} onChange={setPassword} />

        <div className='flex gap-3 pt-1'>
          <button
            id='submitButton'
            type='submit'
            disabled={!user.username.trim() || !password || submitting}
            className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Sign In
          </button>
          <button
            type='button'
            onClick={handleRefuse}
            className='px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50'
          >
            Cancel
          </button>
        </div>

        {ctx.serviceInfo?.support && (
          <p className='text-sm text-neutral-500 mt-2'>
            Feel free to reach our{' '}
            <a href={ctx.serviceInfo.support} target='_blank' rel='noreferrer' className='text-primary-600 underline'>
              helpdesk
            </a>{' '}
            if you have questions.
          </p>
        )}
      </form>

      <hr className='my-4 border-neutral-200' />

      <div className='space-y-2 text-left'>
        <Link to='/access/register' className='block text-primary-600 hover:underline font-medium'>
          Create an account
        </Link>
        <Link to='/access/reset-password' className='block text-primary-600 hover:underline font-medium'>
          Forgot password
        </Link>
        <Link to='/access/change-password' className='block text-primary-600 hover:underline font-medium'>
          Change password
        </Link>
      </div>

      <Alert error={error} />
    </div>
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
