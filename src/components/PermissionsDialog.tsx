import { marked } from 'marked'
import type { AccessState } from '../context/AuthContext'
import type { AppCheck } from '../services/authService'
import { useT } from '../i18n'

interface PermissionsDialogProps {
  accessState: AccessState
  checkAppResult: AppCheck
  onAccept: () => void
  onRefuse: () => void
}

type PermissionLevel = 'read' | 'contribute' | 'manage'

export default function PermissionsDialog ({
  accessState,
  checkAppResult,
  onAccept,
  onRefuse
}: PermissionsDialogProps) {
  const t = useT()
  const permissions = accessState.requestedPermissions || []
  const hasMismatch = !!checkAppResult.mismatchingAccess
  const appId = accessState.requestingAppId || ''

  // Optional clientData consent message — markdown by convention but
  // also accepts plain text (marked.parse renders it as a <p>).
  let consentHtml = ''
  const desc = accessState.clientData?.['app-web-auth:description']
  if (desc?.content) {
    consentHtml = marked.parse(desc.content) as string
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6'>
      <div className='relative mx-auto flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--hds-border)] bg-[var(--hds-card)] text-left shadow-xl'>
        {/* Header */}
        <header className='border-b border-[var(--hds-border)] px-6 py-5'>
          <p className='text-xs font-semibold uppercase tracking-wider text-[var(--hds-muted-foreground)]'>
            {t('consent.intro')}
          </p>
          <h2 className='mt-1 font-sans text-lg font-semibold tracking-tight text-[var(--hds-foreground)]'>
            {t('consent.title', { appId })}
          </h2>
        </header>

        {/* Scrollable body — keeps the action bar fixed at the bottom on
            small viewports / long consent messages.

            Reading order: app's human-readable consent message first,
            then the technical permission breakdown. */}
        <div className='flex-1 overflow-y-auto px-6 py-5 text-sm'>
          {consentHtml && (
            <div
              className='prose prose-sm max-w-none rounded-lg bg-[var(--hds-muted)]/40 p-4 text-[var(--hds-foreground)]'
              dangerouslySetInnerHTML={{ __html: consentHtml }}
            />
          )}

          <p className={`font-medium text-[var(--hds-foreground)] ${consentHtml ? 'mt-5' : ''}`}>
            {t('consent.permissionsHeading', { appId })}
          </p>

          <ul className='mt-3 space-y-2'>
            {permissions.map((p: any, i: number) => (
              <PermissionRow key={i} permission={p} t={t} />
            ))}
          </ul>

          {accessState.expireAfter != null && (
            <p className='mt-4 text-xs text-[var(--hds-muted-foreground)]'>
              {t('consent.expiresAfter', { seconds: String(accessState.expireAfter) })}
            </p>
          )}

          {hasMismatch && (
            <div
              role='alert'
              className='mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900'
            >
              {t('consent.mismatchWarning')}
            </div>
          )}

          <p className='mt-5 text-xs text-[var(--hds-muted-foreground)]'>
            {t('consent.revokeNote')}
          </p>
        </div>

        {/* Action bar — stacked on mobile (primary first / on top), side-by-side on desktop with primary on the right. */}
        <div className='flex flex-col-reverse gap-2 border-t border-[var(--hds-border)] bg-[var(--hds-card)] px-6 py-4 sm:flex-row sm:justify-end sm:gap-3'>
          <button
            id='refusePermissions'
            type='button'
            onClick={onRefuse}
            className='inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--hds-border)] px-4 py-2 text-sm font-semibold text-[var(--hds-foreground)] transition hover:bg-[var(--hds-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/40'
          >
            {t('consent.reject')}
          </button>
          <button
            id='acceptPermissions'
            type='button'
            onClick={onAccept}
            className='inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/40'
          >
            {t('consent.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}

function PermissionRow ({ permission, t }: { permission: any, t: (k: string, v?: Record<string, string>) => string }) {
  const level = (String(permission.level || '').toLowerCase() as PermissionLevel) || 'read'
  const levelLabel = level === 'manage'
    ? t('consent.levelManage')
    : level === 'contribute'
      ? t('consent.levelContribute')
      : t('consent.levelRead')
  const isWildcard = permission.streamId === '*'
  const streamLabel = isWildcard
    ? t('consent.streamAll')
    : (permission.name || permission.defaultName || permission.streamId)

  return (
    <li className='flex items-start gap-3 rounded-lg border border-[var(--hds-border)] bg-[var(--hds-card)] px-3 py-2.5'>
      <LevelIcon level={level} />
      <div className='flex-1 leading-snug'>
        <span className='text-[var(--hds-muted-foreground)]'>{levelLabel}</span>{' '}
        <span className='font-semibold text-[var(--hds-foreground)]'>{streamLabel}</span>
      </div>
    </li>
  )
}

function LevelIcon ({ level }: { level: PermissionLevel }) {
  // Inlined Lucide-shape icons to avoid a new dep for three glyphs.
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'mt-0.5 shrink-0 text-primary-600'
  }
  if (level === 'manage') {
    return (
      <svg {...common}>
        <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' />
        <path d='m9 12 2 2 4-4' />
      </svg>
    )
  }
  if (level === 'contribute') {
    return (
      <svg {...common}>
        <path d='M12 20h9' />
        <path d='M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z' />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}
