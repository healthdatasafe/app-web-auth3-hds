import { useAuth } from './context/AuthContext'
import en from './translations/en'
import fr from './translations/fr'
import es from './translations/es'

const dicts = { en, fr, es } as const

export type Lang = keyof typeof dicts
export const SUPPORTED_LANGS: Lang[] = ['en', 'fr', 'es']

/**
 * Returns a `t(key, vars?)` translator scoped to the current language.
 *
 * - `key` is dot-separated (e.g. `signin.title`).
 * - `vars` are interpolated as `{{name}}` in the source string.
 * - Falls back to `en` if the active language doesn't have the key.
 * - Falls back to the key itself if neither dict has it.
 */
export function useT (): (key: string, vars?: Record<string, string>) => string {
  const { language } = useAuth()
  const lang = isLang(language) ? language : 'en'

  return (key, vars) => {
    let val: any = lookup(dicts[lang], key)
    if (typeof val !== 'string') val = lookup(dicts.en, key)
    if (typeof val !== 'string') return key
    if (vars) {
      for (const k of Object.keys(vars)) {
        val = val.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), vars[k])
      }
    }
    return val
  }
}

function lookup (obj: any, key: string): any {
  return key.split('.').reduce((acc, p) => (acc == null ? acc : acc[p]), obj)
}

function isLang (s: string): s is Lang {
  return (SUPPORTED_LANGS as string[]).includes(s)
}
