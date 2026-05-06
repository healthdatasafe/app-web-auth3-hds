import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { SUPPORTED_LANGS, type Lang } from '../i18n'

const CODE: Record<Lang, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES'
}

const FULL: Record<Lang, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español'
}

/**
 * Compact language dropdown — a small trigger button with the current language
 * code that opens a popover listing all supported languages. Designed to sit
 * in a card corner; the parent positions it (no fixed/absolute by default).
 *
 * Reads + writes `language` on AuthContext (which `useT()` reads from).
 */
export default function LanguageSelector ({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useAuth()
  const active: Lang = (SUPPORTED_LANGS as string[]).includes(language) ? (language as Lang) : 'en'

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return
    function handleDocClick (e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey (e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleDocClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDocClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={FULL[active]}
        className='inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--hds-muted-foreground)] transition hover:bg-[var(--hds-muted)] hover:text-[var(--hds-foreground)] focus:outline-none focus:ring-2 focus:ring-primary-500/40'
      >
        <span>{CODE[active]}</span>
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role='listbox'
          aria-label='Language'
          className='absolute left-0 top-full z-10 mt-1 min-w-[8rem] overflow-hidden rounded-lg border border-[var(--hds-border)] bg-[var(--hds-card)] py-1 text-sm shadow-lg'
        >
          {SUPPORTED_LANGS.map(lang => {
            const isActive = lang === active
            return (
              <li key={lang} role='option' aria-selected={isActive}>
                <button
                  type='button'
                  onClick={() => { setLanguage(lang); setOpen(false) }}
                  className={
                    'flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ' +
                    (isActive
                      ? 'bg-primary-50 font-semibold text-primary-700'
                      : 'text-[var(--hds-foreground)] hover:bg-[var(--hds-muted)]')
                  }
                >
                  <span>{FULL[lang]}</span>
                  <span className='text-[10px] font-semibold uppercase tracking-wider text-[var(--hds-muted-foreground)]'>
                    {CODE[lang]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ChevronDown ({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='12'
      height='12'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={className}
    >
      <polyline points='6 9 12 15 18 9' />
    </svg>
  )
}
