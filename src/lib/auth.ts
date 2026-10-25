import { useSyncExternalStore } from 'react'

// Demo sign-in for the admin area. Credentials are public on the login page on purpose,
// so anyone reviewing the portfolio can open the dashboard. With Supabase connected this
// is replaced by real email/password auth.
export const DEMO_ADMIN = { email: 'admin@glowstudio.ae', password: 'glow2026', name: 'Layla Haddad' }

const KEY = 'glow-admin'
const listeners = new Set<() => void>()

function read() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

let signedIn = read()

function set(value: boolean) {
  signedIn = value
  try {
    if (value) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    /* session storage unavailable: sign-in lasts for this page only */
  }
  listeners.forEach((l) => l())
}

export function signIn(email: string, password: string) {
  const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password
  if (ok) set(true)
  return ok
}

export const signOut = () => set(false)

export function useAuth() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => signedIn,
  )
}
