import { useState } from 'react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
  confirmation?: boolean
}

export default function PasswordInput ({
  value,
  onChange,
  label = 'Password',
  id = 'password',
  confirmation = false
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  const showError = touched && !value
  const showMismatch = confirmation && confirmTouched && value !== confirm

  return (
    <div className='space-y-3'>
      <div>
        <label htmlFor={id} className='block text-sm font-medium text-neutral-700 mb-1'>
          {label}
        </label>
        <div className='relative'>
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm ${showError ? 'border-red-400' : 'border-neutral-300'
            } focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none`}
          />
          <button
            type='button'
            onClick={() => setVisible(!visible)}
            className='absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs'
            tabIndex={-1}
          >
            {visible ? 'hide' : 'show'}
          </button>
        </div>
        {showError && <p className='text-red-500 text-xs mt-1'>Password is required.</p>}
      </div>

      {confirmation && (
        <div>
          <label htmlFor={`${id}Confirmation`} className='block text-sm font-medium text-neutral-700 mb-1'>
            {label} confirmation
          </label>
          <input
            id={`${id}Confirmation`}
            type={visible ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            className={`w-full rounded-lg border px-3 py-2 text-sm ${showMismatch ? 'border-red-400' : 'border-neutral-300'
            } focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none`}
          />
          {showMismatch && <p className='text-red-500 text-xs mt-1'>Password confirmation does not match.</p>}
        </div>
      )}
    </div>
  )
}
