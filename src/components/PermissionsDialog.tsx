import { marked } from 'marked'
import type { AccessState } from '../context/AuthContext'
import type { AppCheck } from '../services/authService'

interface PermissionsDialogProps {
  accessState: AccessState
  checkAppResult: AppCheck
  onAccept: () => void
  onRefuse: () => void
}

export default function PermissionsDialog ({
  accessState,
  checkAppResult,
  onAccept,
  onRefuse
}: PermissionsDialogProps) {
  const permissions = accessState.requestedPermissions || []
  const hasMismatch = !!checkAppResult.mismatchingAccess

  let consentHtml = ''
  if (accessState.clientData) {
    const desc = accessState.clientData['app-web-auth:description']
    if (desc?.content) {
      consentHtml = marked.parse(desc.content) as string
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-md mx-4'>
        <div className='px-5 py-4 border-b border-neutral-200'>
          <h2 className='text-lg font-semibold' id='appIdText'>
            {accessState.requestingAppId}
          </h2>
        </div>

        <div className='px-5 py-4 text-left text-sm'>
          <h4 className='font-medium mb-2'>Is requesting permission:</h4>
          <ul className='list-disc pl-5 space-y-1'>
            {permissions.map((p: any, i: number) => (
              <li key={i}>
                to {p.level?.toLowerCase()}{' '}
                <u>{p.streamId === '*' ? '* (all data)' : (p.name || p.defaultName)}</u>
              </li>
            ))}
          </ul>

          {accessState.expireAfter != null && (
            <p className='mt-2'><b>Will expire after:</b> {accessState.expireAfter}s</p>
          )}

          {consentHtml && (
            <div className='mt-3 prose prose-sm' dangerouslySetInnerHTML={{ __html: consentHtml }} />
          )}
        </div>

        {hasMismatch && (
          <div className='mx-5 mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800'>
            <b>A different access was already given to this app. Do you want to replace it?</b>
          </div>
        )}

        <div className='flex justify-end gap-3 px-5 py-4 border-t border-neutral-200'>
          <button
            id='refusePermissions'
            onClick={onRefuse}
            className='px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50'
          >
            Reject
          </button>
          <button
            id='acceptPermissions'
            onClick={onAccept}
            className='px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700'
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
