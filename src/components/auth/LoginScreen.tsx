import { useState, type FormEvent } from 'react'
import {
  Eye, EyeOff, Mail, Lock, AlertCircle, Loader2,
  BookOpen, Search, FileText, Type, Gamepad2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BackgroundParticles from './BackgroundParticles'
import './auth.css'

interface Props {
  onSwitchToRegister: () => void
}

const DIMENSIONS = [
  { icon: <BookOpen size={10} />, label: 'Word Recognition'       },
  { icon: <Search   size={10} />, label: 'Meaning Identification' },
  { icon: <FileText size={10} />, label: 'Context Comprehension'  },
  { icon: <Type     size={10} />, label: 'Word Form'              },
]

export default function LoginScreen({ onSwitchToRegister }: Props) {
  const { login } = useAuth()

  const [identifier,  setIdentifier]  = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [rememberMe,  setRememberMe]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim() || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    const result = await login(identifier, password, rememberMe)
    setLoading(false)
    if (!result.success) setError(result.error ?? 'Login failed.')
  }

  return (
    <div className="auth-wrapper">
      <BackgroundParticles />

      <div className="auth-card" role="main">

        {/* ── App header ── */}
        <div className="auth-app-header">
          <div className="auth-app-badge">
            <span className="auth-app-badge-icon"><Gamepad2 size={13} /></span>
            <span className="auth-app-badge-text">Dragscape</span>
          </div>
          <span className="auth-app-sub">Vocabulary Adventure · Grade 7</span>
          <div className="auth-dims">
            {DIMENSIONS.map(d => (
              <span key={d.label} className="auth-dim">
                {d.icon} {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <h2 className="auth-heading">Welcome Back</h2>

          {/* Username / Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-id">Username or Email</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><Mail size={15} /></span>
              <input
                id="login-id"
                className="auth-input"
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError('') }}
                placeholder="Enter username or email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-pw">Password</label>
            <div className="auth-input-group">
              <span className="auth-field-icon"><Lock size={15} /></span>
              <input
                id="login-pw"
                className="auth-input auth-input--pw"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter your password"
                autoComplete="current-password"
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
          </div>

          {/* Remember Me */}
          <label className="auth-remember">
            <input
              type="checkbox"
              className="auth-remember-check"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

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
              ? <><span className="auth-spinner-icon"><Loader2 size={16} /></span>Signing in…</>
              : 'Sign In'}
          </button>
        </form>

        {/* ── Switch ── */}
        <div className="auth-switch">
          New to Dragscape?&nbsp;
          <button className="auth-switch-btn" type="button" onClick={onSwitchToRegister}>
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}
