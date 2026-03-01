import { useState, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen    from './components/auth/LoginScreen'
import RegisterScreen from './components/auth/RegisterScreen'
import './App.css'

// Loaded only after the user authenticates — keeps the initial bundle small
const GameScreen      = lazy(() => import('./components/game/GameScreen'))
const AdminDashboard  = lazy(() => import('./components/admin/AdminDashboard'))

// ── Admin account email (create this account in Firebase Auth console) ──────
const ADMIN_EMAIL = 'admin@dragscape.com'

type AuthView = 'login' | 'register'

const LoadingSpinner = () => (
  <div style={{
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-darkest)',
    color: 'var(--col-lightblue)',
  }}>
    <div style={{
      width: 36, height: 36,
      border: '3px solid var(--col-navy)',
      borderTop: '3px solid var(--col-blue)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const [view, setView] = useState<AuthView>('login')

  if (isAuthenticated) {
    // Route admin to the research dashboard
    if (user?.email === ADMIN_EMAIL) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      )
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <GameScreen />
      </Suspense>
    )
  }

  if (view === 'register') {
    return <RegisterScreen onSwitchToLogin={() => setView('login')} />
  }

  return <LoginScreen onSwitchToRegister={() => setView('register')} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
