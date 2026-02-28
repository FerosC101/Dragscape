import { useState, type FormEvent, type ChangeEvent } from 'react'
import {
  Eye, EyeOff, User, Mail, Lock, AlertCircle, Loader2, Gamepad2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BackgroundParticles from './BackgroundParticles'
import './auth.css'

interface Props {
  onSwitchToLogin: () => void
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)                                   score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))           score++
  if (/[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw))   score++
  return score as 0 | 1 | 2 | 3
}

const STRENGTH_BAR_CLASS: Record<number, string> = {
  1: 'auth-strength-bar--weak',
  2: 'auth-strength-bar--medium',
  3: 'auth-strength-bar--strong',
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormFields { fullName: string; username: string; email: string; password: string; confirm: string }

function validate(f: FormFields): string | null {
  if (!f.fullName.trim())            return 'Full name is required.'
  if (!f.username.trim())            return 'Username is required.'
  if (f.username.trim().length < 3)  return 'Username must be at least 3 characters.'
  if (!/^[a-zA-Z0-9_]+$/.test(f.username.trim())) return 'Username: letters, numbers, and underscores only.'
  if (!f.email.includes('@'))        return 'Please enter a valid email address.'
  if (f.password.length < 6)        return 'Password must be at least 6 characters.'
  if (f.password !== f.confirm)      return 'Passwords do not match.'
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterScreen({ onSwitchToLogin }: Props) {
  const { register } = useAuth()

  const [fields, setFields] = useState<FormFields>({
    fullName: '', username: '', email: '', password: '', confirm: '',
  })
  const [showPw,      setShowPw]      = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const strength = getStrength(fields.password)

  const update = (key: keyof FormFields) => (e: ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [key]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validate(fields)
    if (err) { setError(err); return }
    setLoading(true)
    const result = await register({
      fullName: fields.fullName,
      username: fields.username,
      email:    fields.email,
      password: fields.password,
    })
    setLoading(false)
    if (!result.success) setError(result.error ?? 'Registration failed.')
  }

  return (
    <div className="auth-wrapper">
      <BackgroundParticles />

      <div className="auth-card auth-card--register" role="main">

        {/* ── App header ── */}
        <div className="auth-app-header">
          <div className="auth-app-badge">
            <span className="auth-app-badge-icon"><Gamepad2 size={13} /></span>
            <span className="auth-app-badge-text">Dragscape</span>
          </div>
          <span className="auth-app-sub">Vocabulary Adventure · Grade 7</span>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <h2 className="auth-heading">Create Account</h2>

          {/* Full Name */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-name">Full Name</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><User size={15} /></span>
              <input
                id="reg-name"
                className="auth-input"
                type="text"
                value={fields.fullName}
                onChange={update('fullName')}
                placeholder="e.g. Maria Santos"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Username */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-user">Username</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><User size={15} /></span>
              <input
                id="reg-user"
                className="auth-input"
                type="text"
                value={fields.username}
                onChange={update('username')}
                placeholder="e.g. maria_santos"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><Mail size={15} /></span>
              <input
                id="reg-email"
                className="auth-input"
                type="email"
                value={fields.email}
                onChange={update('email')}
                placeholder="e.g. maria@school.edu"
                autoComplete="email"
                autoCapitalize="none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-pw">Password</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><Lock size={15} /></span>
              <input
                id="reg-pw"
                className="auth-input auth-input--pw"
                type={showPw ? 'text' : 'password'}
                value={fields.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fields.password && (
              <div className="auth-strength">
                {[1, 2, 3].map(level => (
                  <div
                    key={level}
                    className={[
                      'auth-strength-bar',
                      strength >= level ? STRENGTH_BAR_CLASS[strength] : '',
                    ].join(' ')}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><Lock size={15} /></span>
              <input
                id="reg-confirm"
                className="auth-input auth-input--pw"
                type={showConfirm ? 'text' : 'password'}
                value={fields.confirm}
                onChange={update('confirm')}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? <><span className="auth-spinner-icon"><Loader2 size={16} /></span>Creating account…</>
              : 'Create Account'}
          </button>
        </form>

        {/* ── Switch ── */}
        <div className="auth-switch">
          Already have an account?&nbsp;
          <button className="auth-switch-btn" type="button" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
