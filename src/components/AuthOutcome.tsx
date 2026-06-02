import { useT } from '../i18n'

interface AuthOutcomeProps {
  status: 'ACCEPTED' | 'REFUSED'
  appId?: string
}

/**
 * Rendered after accept / refuse when the auth window is a user-opened tab
 * (script-opened popups close themselves via `window.close()`). Gives the
 * human an explicit "you can close this tab" affirmation since browsers
 * silently ignore `window.close()` on tabs they didn't open.
 */
export default function AuthOutcome ({ status, appId }: AuthOutcomeProps) {
  const t = useT()
  const accepted = status === 'ACCEPTED'
  const titleKey = accepted ? 'outcome.acceptedTitle' : 'outcome.refusedTitle'
  const subKey = accepted ? 'outcome.acceptedSubWith' : 'outcome.refusedSubWith'

  return (
    <div className='relative mx-auto w-full max-w-md rounded-2xl border border-[var(--hds-border)] bg-[var(--hds-card)] p-6 text-center shadow-sm sm:p-7'>
      <div
        aria-hidden='true'
        className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${
          accepted
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-[var(--hds-muted)] text-[var(--hds-muted-foreground)]'
        }`}
      >
        {accepted ? <CheckIcon /> : <DashIcon />}
      </div>

      <h1 className='font-sans text-xl font-semibold tracking-tight text-[var(--hds-foreground)]'>
        {t(titleKey)}
      </h1>

      {appId && (
        <p className='mt-2 text-sm text-[var(--hds-muted-foreground)]'>
          {t(subKey, { appId })}
        </p>
      )}

      <button
        type='button'
        onClick={() => window.close()}
        className='mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--hds-border)] px-4 py-2.5 text-sm font-medium text-[var(--hds-foreground)] hover:bg-[var(--hds-muted)]'
      >
        {t('outcome.closeButton')}
      </button>
    </div>
  )
}

function CheckIcon () {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

function DashIcon () {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  )
}
