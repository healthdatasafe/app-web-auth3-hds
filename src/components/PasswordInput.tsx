import { useState } from 'react'
import { useT } from '../i18n'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
  confirmation?: boolean
  autoComplete?: string
}

export default function PasswordInput ({
  value,
  onChange,
  label,
  id = 'password',
  confirmation = false,
  autoComplete
}: PasswordInputProps) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const showError = touched && !value
  const showMismatch = confirmation && confirmTouched && value !== confirm

  const fieldLabel = label ?? t('password.label')
  const inputBase = 'w-full rounded-lg border bg-[var(--hds-background)] px-3 py-3 pr-12 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30'

  return (
    <div className='space-y-3'>
      <div>
        <label
          htmlFor={id}
          className='mb-1.5 block text-sm font-medium text-[var(--hds-foreground)]'
        >
          {fieldLabel}
        </label>
        <div className='relative'>
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete={autoComplete ?? (confirmation ? 'new-password' : 'current-password')}
            className={`${inputBase} ${showError ? 'border-[var(--hds-destructive)]' : 'border-[var(--hds-input)]'}`}
          />
          <button
            type='button'
            onClick={() => setVisible(!visible)}
            aria-label={visible ? t('password.hide') : t('password.show')}
            aria-pressed={visible}
            tabIndex={-1}
            className='absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--hds-muted-foreground)] transition hover:bg-[var(--hds-muted)] hover:text-[var(--hds-foreground)]'
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {showError && (
          <p className='mt-1 text-xs text-[var(--hds-destructive)]'>{t('password.required')}</p>
        )}
      </div>

      {confirmation && (
        <div>
          <label
            htmlFor={`${id}Confirmation`}
            className='mb-1.5 block text-sm font-medium text-[var(--hds-foreground)]'
          >
            {label != null ? `${label} ${t('password.confirmationLabel').toLowerCase()}` : t('password.confirmationLabel')}
          </label>
          <input
            id={`${id}Confirmation`}
            type={visible ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            autoComplete='new-password'
            className={`w-full rounded-lg border bg-[var(--hds-background)] px-3 py-3 text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 ${
              showMismatch ? 'border-[var(--hds-destructive)]' : 'border-[var(--hds-input)]'
            }`}
          />
          {showMismatch && (
            <p className='mt-1 text-xs text-[var(--hds-destructive)]'>
              {t('password.confirmationMismatch')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Lucide icons — inlined as SVG to avoid pulling in lucide-react for two glyphs.
// Sourced from lucide.dev (ISC).

function EyeIcon () {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function EyeOffIcon () {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M9.88 9.88a3 3 0 1 0 4.24 4.24' />
      <path d='M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' />
      <path d='M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' />
      <line x1='2' y1='2' x2='22' y2='22' />
    </svg>
  )
}
