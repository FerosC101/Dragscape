/**
 * AdminDashboard — Research admin panel for Dragscape
 *
 * Access: sign in with  admin@dragscape.com
 *
 * ⚠️  FIRESTORE RULES — add these so the admin can query all users:
 * ─────────────────────────────────────────────────────────────────
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Admin has full read access
 *     match /{document=**} {
 *       allow read: if request.auth != null
 *                   && request.auth.token.email == 'admin@dragscape.com';
 *     }
 *     // Regular users can only access their own data
 *     match /users/{userId} {
 *       allow read, write: if request.auth.uid == userId;
 *     }
 *     match /users/{userId}/gameHistory/{gameId} {
 *       allow read, write: if request.auth.uid == userId;
 *     }
 *   }
 * }
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useMemo, useCallback, Fragment, type CSSProperties } from 'react'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth as getFirebaseAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore'
import { db, auth, firebaseConfig } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import type { User, GameRecord, Dimension } from '../../types'
import {
  Users, BarChart3, FileDown, LogOut, RefreshCw,
  Trophy, TrendingUp, Gamepad2, Search, ChevronDown, ChevronRight,
  BookOpen, FileText, Type, Star, Shield, Download, AlertTriangle,
  Calendar, UserPlus, Trash2, X,
} from 'lucide-react'
import './admin.css'

// ─── Local types ──────────────────────────────────────────────────────────────

interface UserRow extends User {
  gamesPlayed: number
  bestPct:     number
  avgPct:      number
  lastPlayed:  string | null
  history:     GameRecord[]
}

type Tab     = 'overview' | 'users' | 'reports' | 'export'
type SortKey = 'fullName' | 'gamesPlayed' | 'bestPct' | 'avgPct' | 'createdAt' | 'lastPlayed'

// ─── Constants ────────────────────────────────────────────────────────────────

const DIMS: Dimension[] = [
  'Word Recognition',
  'Meaning Identification',
  'Context Comprehension',
  'Word Form',
]

const DIM_COLORS: Record<Dimension, string> = {
  'Word Recognition':       '#4ade80',
  'Meaning Identification': '#a78bfa',
  'Context Comprehension':  '#fbbf24',
  'Word Form':              '#38bdf8',
}

const DIM_ICONS: Record<Dimension, typeof BookOpen> = {
  'Word Recognition':       BookOpen,
  'Meaning Identification': Search,
  'Context Comprehension':  FileText,
  'Word Form':              Type,
}

const SCORE_RANGES = [
  { label: 'Outstanding',         range: '90–100', min: 90, max: 100, color: '#22c55e' },
  { label: 'Very Satisfactory',   range: '80–89',  min: 80, max: 89,  color: '#86efac' },
  { label: 'Satisfactory',        range: '75–79',  min: 75, max: 79,  color: '#fde68a' },
  { label: 'Fairly Satisfactory', range: '60–74',  min: 60, max: 74,  color: '#f59e0b' },
  { label: 'Did Not Meet',        range: '0–59',   min: 0,  max: 59,  color: '#f87171' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function getRange(pct: number) {
  return SCORE_RANGES.find(r => pct >= r.min && pct <= r.max) ?? SCORE_RANGES[SCORE_RANGES.length - 1]
}

function downloadCSV(users: UserRow[]) {
  const cols = [
    'User ID', 'Full Name', 'Username', 'Email', 'Registered At',
    'Game #', 'Played At', 'Dimension',
    'Score', 'Total Questions', 'Percentage (%)', 'DepEd Descriptor',
    'Word Recognition (correct/total)', 'Meaning Identification (correct/total)',
    'Context Comprehension (correct/total)', 'Word Form (correct/total)',
  ]

  const rows: string[][] = [cols]

  for (const u of users) {
    if (u.history.length === 0) {
      rows.push([
        u.id, u.fullName, u.username, u.email, u.createdAt,
        '—', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—',
      ])
    } else {
      u.history.forEach((g, gi) => {
        const ds = (d: Dimension) => {
          const s = g.dimScores?.find(x => x.dimension === d)
          return s ? `${s.correct}/${s.total}` : '—'
        }
        const dim = g.dimScores?.length === 1
          ? g.dimScores[0].dimension
          : (g.dimScores?.length ? g.dimScores[0].dimension : '—')
        rows.push([
          u.id, u.fullName, u.username, u.email, u.createdAt,
          String(gi + 1), g.playedAt, dim,
          String(g.score), String(g.total), String(g.pct),
          getRange(g.pct).label,
          ds('Word Recognition'), ds('Meaning Identification'),
          ds('Context Comprehension'), ds('Word Form'),
        ])
      })
    }
  }

  const csv = rows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `dragscape-research-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BarFill({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="adm-bar-track">
      <div className="adm-bar-fill" style={{ width: `${pct}%`, background: color } as CSSProperties} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { logout } = useAuth()

  const [tab,          setTab]          = useState<Tab>('overview')
  const [users,        setUsers]        = useState<UserRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [sortKey,      setSortKey]      = useState<SortKey>('createdAt')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  // ── User management ─────────────────────────────────────────────────────
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [addForm,       setAddForm]       = useState({ fullName: '', username: '', email: '', password: '' })
  const [addErr,        setAddErr]        = useState('')
  const [addPending,    setAddPending]    = useState(false)
  const [removeTarget,  setRemoveTarget]  = useState<UserRow | null>(null)
  const [removePending, setRemovePending] = useState(false)

  // ── Load all data from Firestore ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Diagnostic: log the current auth state
      const fbUser = auth.currentUser
      console.log('[Admin] currentUser uid:', fbUser?.uid, 'email:', fbUser?.email, 'emailVerified:', fbUser?.emailVerified)

      if (!fbUser) {
        setError('Not authenticated — Firebase Auth has no current user. Try signing out and back in.')
        setLoading(false)
        return
      }

      // 1. All user profiles
      console.log('[Admin] Fetching users collection...')
      const userSnap = await getDocs(collection(db, 'users'))
      const rawUsers = userSnap.docs
        .map(d => d.data() as User)
        .filter(u => u.email !== 'admin@dragscape.com')  // exclude admin account itself
      console.log('[Admin] users docs returned:', rawUsers.length, rawUsers.map(u => u.email))

      if (rawUsers.length === 0) {
        setError(
          'No student accounts found in Firestore yet.\n\n' +
          'This happens when users registered before the Firestore security rules were first deployed.\n\n' +
          'Fix: each existing user needs to sign out and sign back in once — ' +
          'the app will automatically recreate their profile in Firestore.\n\n' +
          `(Admin UID: ${fbUser.uid} · Rules are deployed correctly)`
        )
        setLoading(false)
        return
      }

      // 2. Game history for every user — parallel fetches.
      console.log('[Admin] Fetching gameHistory for', rawUsers.length, 'users...')
      const historySnaps = await Promise.all(
        rawUsers.map(u =>
          getDocs(collection(db, 'users', u.id, 'gameHistoryV2'))
        )
      )

      // 3. Enrich each user with their stats
      const validDims = new Set<string>(DIMS)
      const enriched: UserRow[] = rawUsers.map((u, i) => {
        const history = historySnaps[i].docs
          .map(d => d.data() as GameRecord)
          .filter(g =>
            Array.isArray(g.dimScores) &&
            g.dimScores.length === 1 &&
            validDims.has(g.dimScores[0].dimension) &&
            g.total === 10
          )
          .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
        console.log(`[Admin]   ${u.email}: ${history.length} valid V2 game(s)`)
        return {
          ...u,
          history,
          gamesPlayed: history.length,
          bestPct:     history.length ? Math.max(...history.map(g => g.pct)) : 0,
          avgPct:      history.length
            ? Math.round(history.reduce((s, g) => s + g.pct, 0) / history.length)
            : 0,
          lastPlayed: history.length ? history[0].playedAt : null,
        }
      })

      console.log('[Admin] Total enriched users:', enriched.length, 'Total games:', enriched.reduce((s, u) => s + u.gamesPlayed, 0))
      setUsers(enriched)
    } catch (err) {
      console.error('[AdminDashboard] Firestore load error:', err)
      const msg = (err as { message?: string }).message ?? String(err)
      setError(
        msg.toLowerCase().includes('permission')
          ? `Permission denied — the Firestore rules are not granting admin access. ` +
            `Make sure the rules are deployed (firebase deploy --only firestore:rules). ` +
            `UID: ${auth.currentUser?.uid ?? 'null'}. Error: ${msg}`
          : `Failed to load data: ${msg}`
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived data ────────────────────────────────────────────────────────
  const allGames = useMemo(() => users.flatMap(u => u.history), [users])

  const kpis = useMemo(() => ({
    totalUsers:  users.length,
    activeUsers: users.filter(u => u.gamesPlayed > 0).length,
    totalGames:  allGames.length,
    avgPct:      allGames.length
      ? Math.round(allGames.reduce((s, g) => s + g.pct, 0) / allGames.length)
      : 0,
    passRate: allGames.length
      ? Math.round(allGames.filter(g => g.pct >= 75).length / allGames.length * 100)
      : 0,
  }), [users, allGames])

  const scoreDist = useMemo(() =>
    SCORE_RANGES.map(r => {
      const count = allGames.filter(g => g.pct >= r.min && g.pct <= r.max).length
      return { ...r, count, share: allGames.length ? Math.round(count / allGames.length * 100) : 0 }
    }),
  [allGames])

  const dimPerf = useMemo(() =>
    DIMS.map(dim => {
      let correct = 0, total = 0
      allGames.forEach(g => {
        const s = g.dimScores?.find(x => x.dimension === dim)
        if (s) { correct += s.correct; total += s.total }
      })
      return { dim, correct, total, pct: total ? Math.round(correct / total * 100) : 0 }
    }),
  [allGames])

  // Games played by date (last 14 days)
  const recentActivity = useMemo(() => {
    const days: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const count = allGames.filter(g => g.playedAt.slice(0, 10) === dateStr).length
      days.push({ date: dateStr, count })
    }
    return days
  }, [allGames])

  const maxActivity = useMemo(() =>
    Math.max(1, ...recentActivity.map(d => d.count)),
  [recentActivity])

  // ── Filtered / sorted users ─────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase()
    let list = s
      ? users.filter(u =>
          u.fullName.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s))
      : [...users]

    list.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey] ?? ''
      const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? ''
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [users, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleAddUser = useCallback(async () => {
    setAddErr('')
    const { fullName, username, email, password } = addForm
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setAddErr('All fields are required.')
      return
    }
    setAddPending(true)
    try {
      const secondaryApp = initializeApp(firebaseConfig, `adm-add-${Date.now()}`)
      const secondaryAuth = getFirebaseAuth(secondaryApp)
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        id:        cred.user.uid,
        fullName:  fullName.trim(),
        username:  username.trim().toLowerCase(),
        email:     email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
      })
      await deleteApp(secondaryApp)
      setShowAddModal(false)
      setAddForm({ fullName: '', username: '', email: '', password: '' })
      await load()
    } catch (err) {
      const msg = (err as { message?: string }).message ?? String(err)
      setAddErr(msg.replace('Firebase: ', '').replace(/\s*\(auth\/.*?\)/, ''))
    } finally {
      setAddPending(false)
    }
  }, [addForm, load])

  const handleRemoveUser = useCallback(async (u: UserRow) => {
    setRemovePending(true)
    try {
      const [histSnap, histV2Snap] = await Promise.all([
        getDocs(collection(db, 'users', u.id, 'gameHistory')),
        getDocs(collection(db, 'users', u.id, 'gameHistoryV2')),
      ])
      const batch = writeBatch(db)
      histSnap.docs.forEach(d => batch.delete(d.ref))
      histV2Snap.docs.forEach(d => batch.delete(d.ref))
      batch.delete(doc(db, 'users', u.id))
      await batch.commit()
      setRemoveTarget(null)
      await load()
    } catch (err) {
      console.error('[Admin] Remove user error:', err)
    } finally {
      setRemovePending(false)
    }
  }, [load])

  const NAV: [Tab, string, typeof TrendingUp][] = [
    ['overview', 'Overview', TrendingUp],
    ['users',    'Users',    Users],
    ['reports',  'Reports',  BarChart3],
    ['export',   'Export',   FileDown],
  ]

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="adm-root">

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <div className="adm-brand-icon"><Shield size={16} /></div>
          <div>
            <span className="adm-brand-name">Dragscape</span>
            <span className="adm-brand-role">Admin Panel</span>
          </div>
        </div>

        <nav className="adm-nav">
          {NAV.map(([t, label, Icon]) => (
            <button
              key={t}
              className={`adm-nav-item${tab === t ? ' adm-nav-item--active' : ''}`}
              onClick={() => setTab(t)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="adm-logout" onClick={logout}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">

        {/* Top bar */}
        <header className="adm-topbar">
          <div>
            <h1 className="adm-page-title">
              {tab === 'overview' ? 'Overview'    :
               tab === 'users'   ? 'Users'        :
               tab === 'reports' ? 'Reports'      : 'Export Data'}
            </h1>
            <p className="adm-page-sub">Dragscape · Grade 7 Vocabulary Research Dashboard</p>
          </div>
          <button className="adm-refresh" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'adm-spinning' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </header>

        {/* Mobile tab bar */}
        <div className="adm-mobile-nav">
          {NAV.map(([t, label, Icon]) => (
            <button
              key={t}
              className={`adm-mobile-nav-item${tab === t ? ' adm-mobile-nav-item--active' : ''}`}
              onClick={() => setTab(t)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="adm-alert" style={{ whiteSpace: 'pre-line' }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="adm-loader">
            <div className="adm-spinner" />
            <span>Loading data from Firestore…</span>
          </div>
        ) : (
          <div className="adm-body">

            {/* ── KPI Cards (always shown) ── */}
            <div className="adm-kpi-row">
              {([
                { label: 'Total Users',   value: kpis.totalUsers,          sub: `${kpis.activeUsers} have played`,   color: '#3b82f6', Icon: Users    },
                { label: 'Total Sessions',value: kpis.totalGames,          sub: 'game sessions recorded',            color: '#10b981', Icon: Gamepad2 },
                { label: 'Average Score', value: `${kpis.avgPct}%`,        sub: 'across all sessions',               color: '#f59e0b', Icon: Star     },
                { label: 'Pass Rate',     value: `${kpis.passRate}%`,      sub: '≥75% (DepEd passing)',              color: '#8b5cf6', Icon: Trophy   },
              ] as const).map(k => (
                <div key={k.label} className="adm-kpi" style={{ '--c': k.color } as CSSProperties}>
                  <div className="adm-kpi-icon"><k.Icon size={18} /></div>
                  <div>
                    <div className="adm-kpi-value">{k.value}</div>
                    <div className="adm-kpi-label">{k.label}</div>
                    <div className="adm-kpi-sub">{k.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
            {tab === 'overview' && (
              <div className="adm-grid">

                {/* Score Distribution */}
                <div className="adm-card adm-card--wide">
                  <h3 className="adm-card-title">Score Distribution — DepEd Descriptors</h3>
                  <div className="adm-dist-list">
                    {scoreDist.map(r => (
                      <div key={r.label} className="adm-dist-row">
                        <div className="adm-dist-meta">
                          <span className="adm-dist-dot" style={{ background: r.color }} />
                          <span className="adm-dist-label">{r.label}</span>
                          <span className="adm-dist-range">({r.range}%)</span>
                        </div>
                        <div className="adm-bar-wrap">
                          <BarFill pct={r.share} color={r.color} />
                          <span className="adm-dist-count">
                            {r.count} <small>({r.share}%)</small>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity (14-day bar chart) */}
                <div className="adm-card adm-card--wide">
                  <h3 className="adm-card-title">
                    <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    Sessions — Last 14 Days
                  </h3>
                  <div className="adm-activity-chart">
                    {recentActivity.map(d => (
                      <div key={d.date} className="adm-activity-col">
                        <span className="adm-activity-count">{d.count > 0 ? d.count : ''}</span>
                        <div
                          className="adm-activity-bar"
                          style={{ height: `${Math.round((d.count / maxActivity) * 80) + 4}px` }}
                          title={`${d.date}: ${d.count} session${d.count !== 1 ? 's' : ''}`}
                        />
                        <span className="adm-activity-date">
                          {new Date(d.date).toLocaleDateString('en-PH', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimension Performance */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Dimension Performance</h3>
                  <div className="adm-dist-list">
                    {dimPerf.map(d => {
                      const Icon = DIM_ICONS[d.dim]
                      return (
                        <div key={d.dim} className="adm-dist-row">
                          <div className="adm-dist-meta">
                            <Icon size={12} style={{ color: DIM_COLORS[d.dim], flexShrink: 0 }} />
                            <span className="adm-dist-label" style={{ fontSize: '0.78rem' }}>{d.dim}</span>
                          </div>
                          <div className="adm-bar-wrap">
                            <BarFill pct={d.pct} color={DIM_COLORS[d.dim]} />
                            <span className="adm-dist-count">
                              {d.pct}% <small>({d.correct}/{d.total})</small>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Top Performers</h3>
                  <div className="adm-top-list">
                    {[...users]
                      .filter(u => u.gamesPlayed > 0)
                      .sort((a, b) => b.avgPct - a.avgPct)
                      .slice(0, 5)
                      .map((u, i) => (
                        <div key={u.id} className="adm-top-row">
                          <span className="adm-top-rank">#{i + 1}</span>
                          <div className="adm-top-info">
                            <span className="adm-top-name">{u.fullName}</span>
                            <span className="adm-top-user">@{u.username}</span>
                          </div>
                          <div className="adm-top-right">
                            <span className="adm-top-score" style={{ color: getRange(u.avgPct).color }}>
                              {u.avgPct}%
                            </span>
                            <span className="adm-top-desc">{getRange(u.avgPct).label}</span>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.gamesPlayed > 0).length === 0 && (
                      <p className="adm-empty">No games played yet.</p>
                    )}
                  </div>
                </div>

                {/* Dimension Summary */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Dimension Scores</h3>
                  <div className="adm-dist-list">
                    {dimPerf.map(d => {
                      const Icon = DIM_ICONS[d.dim]
                      return (
                        <div key={d.dim} className="adm-dist-row">
                          <div className="adm-dist-meta">
                            <Icon size={12} style={{ color: DIM_COLORS[d.dim], flexShrink: 0 }} />
                            <span className="adm-dist-label" style={{ fontSize: '0.78rem' }}>{d.dim}</span>
                          </div>
                          <div className="adm-bar-wrap">
                            <BarFill pct={d.pct} color={DIM_COLORS[d.dim]} />
                            <span className="adm-dist-count">
                              {d.pct}% <small>({d.correct}/{d.total})</small>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Non-participants */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Haven't Played Yet</h3>
                  <div className="adm-noplay-list">
                    {users.filter(u => u.gamesPlayed === 0).length === 0
                      ? <p className="adm-empty">All users have played at least once.</p>
                      : users.filter(u => u.gamesPlayed === 0).map(u => (
                          <div key={u.id} className="adm-noplay-row">
                            <div className="adm-top-info">
                              <span className="adm-top-name">{u.fullName}</span>
                              <span className="adm-top-user">{u.email}</span>
                            </div>
                            <span className="adm-na-badge">No sessions</span>
                          </div>
                        ))
                    }
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════════ USERS TAB ══════════════════ */}
            {tab === 'users' && (
              <div className="adm-users-section">

                <div className="adm-search-row">
                  <div className="adm-search-box">
                    <Search size={14} />
                    <input
                      className="adm-search-input"
                      placeholder="Search by name, username, or email…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <span className="adm-count-badge">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
                  <button className="adm-add-user-btn" onClick={() => { setShowAddModal(true); setAddErr('') }}>
                    <UserPlus size={14} />
                    Add User
                  </button>
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        {([
                          ['fullName',    '#  Name'],
                          ['gamesPlayed', 'Sessions'],
                          ['bestPct',     'Best %'],
                          ['avgPct',      'Avg %'],
                          ['createdAt',   'Registered'],
                          ['lastPlayed',  'Last Played'],
                        ] as [SortKey, string][]).map(([key, label]) => (
                          <th key={key} className="adm-th" onClick={() => toggleSort(key)}>
                            {label}
                            {sortKey === key && (
                              <span className="adm-sort-icon">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                            )}
                          </th>
                        ))}
                        <th className="adm-th">History</th>
                        <th className="adm-th">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, ui) => (
                        <Fragment key={u.id}>
                          <tr className="adm-tr">
                            <td className="adm-td">
                              <div className="adm-user-cell">
                                <span className="adm-user-idx">{ui + 1}.</span>
                                <div>
                                  <span className="adm-user-name">{u.fullName}</span>
                                  <span className="adm-user-email">{u.email}</span>
                                  <span className="adm-user-un">@{u.username}</span>
                                </div>
                              </div>
                            </td>
                            <td className="adm-td adm-td--center">
                              <span className={`adm-badge ${u.gamesPlayed > 0 ? 'adm-badge--blue' : 'adm-badge--gray'}`}>
                                {u.gamesPlayed}
                              </span>
                            </td>
                            <td className="adm-td adm-td--center">
                              {u.gamesPlayed > 0
                                ? <span style={{ color: getRange(u.bestPct).color, fontWeight: 700 }}>{u.bestPct}%</span>
                                : <span className="adm-na">—</span>}
                            </td>
                            <td className="adm-td adm-td--center">
                              {u.gamesPlayed > 0
                                ? <span style={{ color: getRange(u.avgPct).color, fontWeight: 600 }}>{u.avgPct}%</span>
                                : <span className="adm-na">—</span>}
                            </td>
                            <td className="adm-td adm-td--small">{fmtShort(u.createdAt)}</td>
                            <td className="adm-td adm-td--small">
                              {u.lastPlayed ? fmtShort(u.lastPlayed) : <span className="adm-na">—</span>}
                            </td>
                            <td className="adm-td adm-td--center">
                              <button
                                className="adm-expand-btn"
                                onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                                disabled={u.gamesPlayed === 0}
                                title={u.gamesPlayed === 0 ? 'No sessions yet' : 'View game history'}
                              >
                                {expanded === u.id
                                  ? <ChevronDown size={14} />
                                  : <ChevronRight size={14} />}
                              </button>
                            </td>
                            <td className="adm-td adm-td--center">
                              <button
                                className="adm-remove-btn"
                                onClick={() => setRemoveTarget(u)}
                                title="Remove user"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>

                          {expanded === u.id && (
                            <tr className="adm-detail-row">
                              <td colSpan={8} className="adm-detail-td">
                                <div className="adm-inner-wrap">
                                  <p className="adm-inner-title">
                                    Game history for <strong>{u.fullName}</strong> — {u.history.length} session{u.history.length !== 1 ? 's' : ''}
                                  </p>
                                  <div className="adm-inner-scroll">
                                    <table className="adm-inner-table">
                                      <thead>
                                        <tr>
                                          <th>#</th>
                                          <th>Date & Time</th>
                                          <th>Dimension</th>
                                          <th>Score</th>
                                          <th>%</th>
                                          <th>Descriptor</th>
                                          <th>Word Rec.</th>
                                          <th>Meaning ID</th>
                                          <th>Context</th>
                                          <th>Word Form</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {u.history.map((g, gi) => {
                                          const desc = getRange(g.pct)
                                          return (
                                            <tr key={g.id || gi}>
                                              <td>{gi + 1}</td>
                                              <td style={{ whiteSpace: 'nowrap' }}>{fmt(g.playedAt)}</td>
                                              <td>
                                                {g.dimScores?.length
                                                  ? <span style={{ color: DIM_COLORS[g.dimScores[0].dimension], fontWeight: 600, fontSize: '0.76rem' }}>
                                                      {g.dimScores[0].dimension}
                                                    </span>
                                                  : <span className="adm-na">—</span>}
                                              </td>
                                              <td style={{ fontWeight: 700 }}>{g.score}/{g.total}</td>
                                              <td style={{ color: desc.color, fontWeight: 800 }}>{g.pct}%</td>
                                              <td style={{ color: desc.color, fontSize: '0.76rem' }}>{desc.label}</td>
                                              {DIMS.map(d => {
                                                const s = g.dimScores?.find(x => x.dimension === d)
                                                return (
                                                  <td key={d} style={{ color: DIM_COLORS[d], fontWeight: 600 }}>
                                                    {s ? `${s.correct}/${s.total}` : '—'}
                                                  </td>
                                                )
                                              })}
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  {/* Dimension Averages */}
                                  {(() => {
                                    const dimAvgs = DIMS.map(dim => {
                                      const sessions = u.history.filter(g => g.dimScores?.[0]?.dimension === dim)
                                      if (!sessions.length) return null
                                      const avgPct     = Math.round(sessions.reduce((s, g) => s + g.pct, 0) / sessions.length)
                                      const totCorrect = sessions.reduce((s, g) => s + g.dimScores[0].correct, 0)
                                      const totTotal   = sessions.reduce((s, g) => s + g.dimScores[0].total,   0)
                                      return {
                                        dim,
                                        count:      sessions.length,
                                        avgCorrect: (totCorrect / sessions.length).toFixed(1),
                                        avgTotal:   (totTotal   / sessions.length).toFixed(1),
                                        avgPct,
                                      }
                                    }).filter(Boolean) as { dim: Dimension; count: number; avgCorrect: string; avgTotal: string; avgPct: number }[]
                                    if (!dimAvgs.length) return null
                                    return (
                                      <div className="adm-dim-avg-wrap">
                                        <p className="adm-inner-title" style={{ marginBottom: '0.5rem' }}>Dimension Averages</p>
                                        <div className="adm-inner-scroll">
                                          <table className="adm-inner-table">
                                            <thead>
                                              <tr>
                                                <th>Dimension</th>
                                                <th>Sessions</th>
                                                <th>Avg Correct / Total</th>
                                                <th>Avg %</th>
                                                <th style={{ width: 120 }}>Bar</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {dimAvgs.map(d => (
                                                <tr key={d.dim}>
                                                  <td style={{ color: DIM_COLORS[d.dim], fontWeight: 600 }}>{d.dim}</td>
                                                  <td>{d.count}</td>
                                                  <td style={{ color: '#475569' }}>{d.avgCorrect} / {d.avgTotal}</td>
                                                  <td style={{ color: getRange(d.avgPct).color, fontWeight: 700 }}>{d.avgPct}%</td>
                                                  <td><BarFill pct={d.avgPct} color={DIM_COLORS[d.dim]} /></td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={8} className="adm-td adm-empty">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════ REPORTS TAB ══════════════════ */}
            {tab === 'reports' && (
              <div className="adm-grid">

                {/* Score Distribution Table */}
                <div className="adm-card adm-card--wide">
                  <h3 className="adm-card-title">Score Distribution — DepEd Descriptors</h3>
                  <table className="adm-report-table">
                    <thead>
                      <tr>
                        <th>Descriptor</th>
                        <th>Score Range</th>
                        <th>Sessions</th>
                        <th>Share</th>
                        <th style={{ width: 180 }}>Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreDist.map(r => (
                        <tr key={r.label}>
                          <td>
                            <span className="adm-report-dot" style={{ background: r.color }} />
                            {r.label}
                          </td>
                          <td>{r.range}%</td>
                          <td style={{ fontWeight: 700 }}>{r.count}</td>
                          <td style={{ color: r.color, fontWeight: 700 }}>{r.share}%</td>
                          <td><BarFill pct={r.share} color={r.color} /></td>
                        </tr>
                      ))}
                      <tr className="adm-total-row">
                        <td colSpan={2}><strong>Total</strong></td>
                        <td><strong>{allGames.length}</strong></td>
                        <td><strong>100%</strong></td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Dimension Report */}
                <div className="adm-card">
                  <h3 className="adm-card-title">By Vocabulary Dimension</h3>
                  <table className="adm-report-table">
                    <thead>
                      <tr><th>Dimension</th><th>Correct / Total</th><th>Accuracy</th><th style={{ width: 120 }}>Bar</th></tr>
                    </thead>
                    <tbody>
                      {dimPerf.map(d => (
                        <tr key={d.dim}>
                          <td>
                            <span style={{ color: DIM_COLORS[d.dim], fontWeight: 600 }}>{d.dim}</span>
                          </td>
                          <td style={{ color: '#64748b' }}>{d.correct}/{d.total}</td>
                          <td style={{ color: DIM_COLORS[d.dim], fontWeight: 700 }}>{d.pct}%</td>
                          <td><BarFill pct={d.pct} color={DIM_COLORS[d.dim]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Research Summary */}
                <div className="adm-card">
                  <h3 className="adm-card-title">Research Summary</h3>
                  <dl className="adm-summary-list">
                    {[
                      ['Total Respondents',          String(kpis.totalUsers)],
                      ['Active Respondents',         String(kpis.activeUsers)],
                      ['Did Not Participate',        String(kpis.totalUsers - kpis.activeUsers)],
                      ['Total Game Sessions',        String(kpis.totalGames)],
                      ['Overall Average Score',      `${kpis.avgPct}%`],
                      ['DepEd Pass Rate (≥75%)',     `${kpis.passRate}%`],
                      ['Outstanding (≥90%)',         `${scoreDist[0].count} (${scoreDist[0].share}%)`],
                      ['Very Satisfactory (80–89%)', `${scoreDist[1].count} (${scoreDist[1].share}%)`],
                      ['Satisfactory (75–79%)',      `${scoreDist[2].count} (${scoreDist[2].share}%)`],
                      ['Fairly Satisfactory (60–74%)', `${scoreDist[3].count} (${scoreDist[3].share}%)`],
                      ['Did Not Meet (<60%)',        `${scoreDist[4].count} (${scoreDist[4].share}%)`],
                      ['Highest Dimension',          dimPerf.length ? dimPerf.reduce((a, b) => a.pct >= b.pct ? a : b).dim : '—'],
                      ['Lowest Dimension',           dimPerf.length ? dimPerf.reduce((a, b) => a.pct <= b.pct ? a : b).dim : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="adm-summary-row">
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

              </div>
            )}

            {/* ══════════════════ EXPORT TAB ══════════════════ */}
            {tab === 'export' && (
              <div className="adm-export-section">
                <div className="adm-card adm-card--wide">
                  <h3 className="adm-card-title">Export Research Data</h3>
                  <p className="adm-export-desc">
                    Download all user profiles and game session data as a CSV file.
                    Includes per-dimension scores and DepEd descriptors for each session.
                    The file is UTF-8 encoded with BOM for compatibility with Microsoft Excel.
                  </p>

                  <div className="adm-export-stats">
                    {[
                      { value: kpis.totalUsers,  label: 'Users'    },
                      { value: kpis.totalGames,  label: 'Sessions' },
                      { value: kpis.totalUsers - kpis.activeUsers + kpis.totalGames, label: 'CSV Rows' },
                      { value: 16,               label: 'Columns'  },
                    ].map(s => (
                      <div key={s.label} className="adm-export-stat">
                        <span className="adm-export-stat-value">{s.value}</span>
                        <span className="adm-export-stat-label">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="adm-export-cols">
                    <p className="adm-export-cols-title">Columns included in CSV:</p>
                    <ul>
                      {[
                        'User ID',
                        'Full Name',
                        'Username',
                        'Email',
                        'Registered At',
                        'Game # (session number per user)',
                        'Played At (ISO timestamp)',
                        'Dimension (Word Recognition / Meaning Identification / Context Comprehension / Word Form)',
                        'Score (correct answers)',
                        'Total Questions',
                        'Percentage (%)',
                        'DepEd Descriptor',
                        'Word Recognition (correct/total)',
                        'Meaning Identification (correct/total)',
                        'Context Comprehension (correct/total)',
                        'Word Form (correct/total)',
                      ].map(c => <li key={c}>{c}</li>)}
                    </ul>
                  </div>

                  <button
                    className="adm-download-btn"
                    onClick={() => downloadCSV(users)}
                    disabled={users.length === 0}
                  >
                    <Download size={16} />
                    Download CSV  ({kpis.totalUsers} users · {kpis.totalGames} sessions)
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="adm-modal-overlay" onClick={() => !addPending && setShowAddModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Add New User</h3>
              <button className="adm-modal-close" onClick={() => setShowAddModal(false)} disabled={addPending}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              {addErr && <div className="adm-modal-err">{addErr}</div>}
              {([
                { key: 'fullName', label: 'Full Name', placeholder: 'e.g. Juan Dela Cruz',  type: 'text'     },
                { key: 'username', label: 'Username',  placeholder: 'e.g. jdelacruz',       type: 'text'     },
                { key: 'email',    label: 'Email',     placeholder: 'e.g. juan@email.com',  type: 'email'    },
                { key: 'password', label: 'Password',  placeholder: 'Min 6 characters',     type: 'password' },
              ] as { key: keyof typeof addForm; label: string; placeholder: string; type: string }[]).map(f => (
                <label key={f.key} className="adm-modal-label">
                  <span>{f.label}</span>
                  <input
                    className="adm-modal-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={addForm[f.key]}
                    onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    disabled={addPending}
                  />
                </label>
              ))}
            </div>
            <div className="adm-modal-footer">
              <button className="adm-modal-cancel" onClick={() => setShowAddModal(false)} disabled={addPending}>Cancel</button>
              <button className="adm-modal-submit" onClick={handleAddUser} disabled={addPending}>
                {addPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove User Confirmation ── */}
      {removeTarget && (
        <div className="adm-modal-overlay" onClick={() => !removePending && setRemoveTarget(null)}>
          <div className="adm-modal adm-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Remove User</h3>
              <button className="adm-modal-close" onClick={() => setRemoveTarget(null)} disabled={removePending}>
                <X size={16} />
              </button>
            </div>
            <div className="adm-modal-body">
              <p className="adm-modal-confirm-text">
                Remove <strong>{removeTarget.fullName}</strong>? This will permanently delete
                all their Firestore data including game history. Their Firebase Auth account
                must be removed separately via the Firebase Console.
              </p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-modal-cancel" onClick={() => setRemoveTarget(null)} disabled={removePending}>Cancel</button>
              <button className="adm-modal-danger" onClick={() => handleRemoveUser(removeTarget)} disabled={removePending}>
                {removePending ? 'Removing…' : 'Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
