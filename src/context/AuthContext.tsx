import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { User, AuthContextType, RegisterData, AuthResult } from '../types'

const AuthContext = createContext<AuthContextType | null>(null)

// ─── Firebase error → human message ─────────────────────────────────────────

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/user-not-found':         'No account found with that identifier.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/email-already-in-use':   'This email is already registered.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

// ─── Fetch profile from Firestore ────────────────────────────────────────────

async function fetchProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as User) : null
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      // Read flags inside the callback so they reflect values set by login()/register()
      const remember = localStorage.getItem('ds_remember') === '1'
      const session  = sessionStorage.getItem('ds_sid')    === '1'

      try {
        if (fbUser) {
          if (!remember && !session) {
            // Stale Firebase token — silently discard and sign out
            setUser(null)
            setBooting(false)
            signOut(auth).catch(() => {})
            return
          }

          // Try Firestore profile first
          let profile = await fetchProfile(fbUser.uid)

          if (!profile) {
            // No profile in Firestore — build one from Auth data and persist it.
            // This self-heals accounts whose initial Firestore write failed
            // (e.g. because the security rules weren't deployed at sign-up time).
            profile = {
              id:        fbUser.uid,
              fullName:  fbUser.displayName ?? '',
              username:  '',
              email:     fbUser.email ?? '',
              createdAt: new Date().toISOString(),
            }
            try {
              await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true })
            } catch (writeErr) {
              console.warn('[Dragscape] Could not write fallback profile:', writeErr)
            }
          }

          setUser(profile)
        } else {
          setUser(null)
        }
      } catch {
        // Firestore read failed — still mark as logged in using Auth data
        if (fbUser) {
          setUser({
            id:        fbUser.uid,
            fullName:  fbUser.displayName ?? '',
            username:  '',
            email:     fbUser.email ?? '',
            createdAt: new Date().toISOString(),
          })
        } else {
          setUser(null)
        }
      } finally {
        setBooting(false)
      }
    })
    return unsub
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (identifier: string, password: string, rememberMe = false): Promise<AuthResult> => {
    try {
      let email = identifier.trim().toLowerCase()
      let knownProfile: User | null = null

      // Treat as username → look up email in Firestore
      if (!email.includes('@')) {
        const q    = query(collection(db, 'users'), where('username', '==', email))
        const snap = await getDocs(q)
        if (snap.empty) return { success: false, error: 'No account found with that username.' }
        knownProfile = snap.docs[0].data() as User
        email = knownProfile.email
      }

      const cred = await signInWithEmailAndPassword(auth, email, password)

      // Set session markers
      sessionStorage.setItem('ds_sid', '1')
      if (rememberMe) {
        localStorage.setItem('ds_remember', '1')
      } else {
        localStorage.removeItem('ds_remember')
      }

      // Immediately unblock the UI — don't wait for onAuthStateChanged + Firestore
      setUser(knownProfile ?? {
        id:        cred.user.uid,
        fullName:  cred.user.displayName ?? '',
        username:  '',
        email:     cred.user.email ?? '',
        createdAt: new Date().toISOString(),
      })

      return { success: true }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      return { success: false, error: friendlyError(code) }
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      const username = data.username.trim().toLowerCase()

      // Check username uniqueness
      const q    = query(collection(db, 'users'), where('username', '==', username))
      const snap = await getDocs(q)
      if (!snap.empty) return { success: false, error: 'Username already taken — try another.' }

      const cred = await createUserWithEmailAndPassword(
        auth,
        data.email.trim().toLowerCase(),
        data.password,
      )
      await updateProfile(cred.user, { displayName: data.fullName.trim() })

      // Mark this as a live session so onAuthStateChanged lets the new user through
      sessionStorage.setItem('ds_sid', '1')

      const profile: User = {
        id:        cred.user.uid,
        fullName:  data.fullName.trim(),
        username,
        email:     data.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      }
      try {
        await setDoc(doc(db, 'users', cred.user.uid), profile)
      } catch (fsErr) {
        // Auth succeeded but Firestore profile write failed.
        // Log it — the user can still play, but username login won't work
        // until the profile is written.
        console.error('[Dragscape] Failed to write user profile to Firestore:', fsErr)
      }
      setUser(profile)
      return { success: true }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      return { success: false, error: friendlyError(code) }
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    localStorage.removeItem('ds_remember')
    sessionStorage.removeItem('ds_sid')
    await signOut(auth)
    setUser(null)
  }

  // Don't render children until Firebase has resolved the session
  if (booting) return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'var(--bg-darkest)',
      color: 'var(--col-lightblue)',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--col-navy)',
        borderTop: '3px solid var(--col-blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Loading Dragscape…</span>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
