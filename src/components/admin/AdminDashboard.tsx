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
import { collection, getDocs, collectionGroup } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import type { User, GameRecord, Difficulty, Dimension } from '../../types'
import {
  Users, BarChart3, FileDown, LogOut, RefreshCw,
  Trophy, TrendingUp, Gamepad2, Search, ChevronDown, ChevronRight,
  BookOpen, FileText, Type, Star, Shield, Download, AlertTriangle,
  Calendar,
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

const DIFF_META: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#4ade80' },
  medium: { label: 'Medium', color: '#fbbf24' },
  hard:   { label: 'Hard',   color: '#ef4444' },
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
    'Game #', 'Played At', 'Difficulty',
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
        rows.push([
          u.id, u.fullName, u.username, u.email, u.createdAt,
          String(gi + 1), g.playedAt, g.difficulty,
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

  const [tab,      setTab]      = useState<Tab>('overview')
  const [users,    setUsers]    = useState<UserRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sortKey,  setSortKey]  = useState<SortKey>('createdAt')
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc')

  // ── Load all data from Firestore ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // 1. All user profiles
      const userSnap = await getDocs(collection(db, 'users'))
      const rawUsers = userSnap.docs.map(d => d.data() as User)

      // 2. All game records across all users via collectionGroup
      const gameSnap = await getDocs(collectionGroup(db, 'gameHistory'))
      const gamesByUser = new Map<string, GameRecord[]>()
      gameSnap.docs.forEach(d => {
        const uid = d.ref.parent.parent?.id ?? ''
        const arr = gamesByUser.get(uid) ?? []
        arr.push(d.data() as GameRecord)
        gamesByUser.set(uid, arr)
      })

      // 3. Enrich each user with their stats
      const enriched: UserRow[] = rawUsers.map(u => {
        const history = (gamesByUser.get(u.id) ?? []).sort(
          (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
        )
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

      setUsers(enriched)
    } catch {
      setError('Failed to load data. Ensure Firestore rules allow admin reads (see file header).')
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

  const diffBreak = useMemo(() =>
    (['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
      const gs = allGames.filter(g => g.difficulty === d)
      return {
        d,
        count: gs.length,
        avg:   gs.length ? Math.round(gs.reduce((s, g) => s + g.pct, 0) / gs.length) : 0,
        pass:  gs.length ? Math.round(gs.filter(g => g.pct >= 75).length / gs.length * 100) : 0,
      }
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
          <div className="adm-alert">
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
                  <h3 className="adm-card-title">🏆 Top Performers</h3>
                  <div className="adm-top-list">
                    {[...users]
                      .filter(u => u.gamesPlayed > 0)
                      .sort((a, b) => b.bestPct - a.bestPct)
                      .slice(0, 5)
                      .map((u, i) => (
                        <div key={u.id} className="adm-top-row">
                          <span className="adm-top-rank">#{i + 1}</span>
                          <div className="adm-top-info">
                            <span className="adm-top-name">{u.fullName}</span>
                            <span className="adm-top-user">@{u.username}</span>
                          </div>
                          <div className="adm-top-right">
                            <span className="adm-top-score" style={{ color: getRange(u.bestPct).color }}>
                              {u.bestPct}%
                            </span>
                            <span className="adm-top-desc">{getRange(u.bestPct).label}</span>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.gamesPlayed > 0).length === 0 && (
                      <p className="adm-empty">No games played yet.</p>
                    )}
                  </div>
                </div>

                {/* Difficulty Breakdown */}
                <div className="adm-card">
                  <h3 className="adm-card-title">By Difficulty Level</h3>
                  <div className="adm-diff-grid">
                    {diffBreak.map(d => (
                      <div
                        key={d.d}
                        className="adm-diff-cell"
                        style={{ '--dc': DIFF_META[d.d].color } as CSSProperties}
                      >
                        <span className="adm-diff-emoji">
                          {d.d === 'easy' ? '⚡' : d.d === 'medium' ? '🔥' : '👑'}
                        </span>
                        <span className="adm-diff-label">{DIFF_META[d.d].label}</span>
                        <span className="adm-diff-count">{d.count} sessions</span>
                        <span className="adm-diff-avg">{d.avg}% avg</span>
                        <div className="adm-bar-track" style={{ marginTop: 6 }}>
                          <div className="adm-bar-fill" style={{ width: `${d.avg}%`, background: DIFF_META[d.d].color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Non-participants */}
                <div className="adm-card">
                  <h3 className="adm-card-title">⚠️ Haven't Played Yet</h3>
                  <div className="adm-noplay-list">
                    {users.filter(u => u.gamesPlayed === 0).length === 0
                      ? <p className="adm-empty">All users have played at least once. 🎉</p>
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
                          </tr>

                          {expanded === u.id && (
                            <tr className="adm-detail-row">
                              <td colSpan={7} className="adm-detail-td">
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
                                          <th>Difficulty</th>
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
                                                <span style={{ color: DIFF_META[g.difficulty].color, fontWeight: 600 }}>
                                                  {g.difficulty.charAt(0).toUpperCase() + g.difficulty.slice(1)}
                                                </span>
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
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="adm-td adm-empty">No users found.</td>
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
                  <h3 className="adm-card-title">📊 Score Distribution — DepEd Descriptors</h3>
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

                {/* Difficulty Report */}
                <div className="adm-card">
                  <h3 className="adm-card-title">🎮 By Difficulty Level</h3>
                  <table className="adm-report-table">
                    <thead>
                      <tr><th>Difficulty</th><th>Sessions</th><th>Avg Score</th><th>Pass Rate</th><th style={{ width: 120 }}>Avg Bar</th></tr>
                    </thead>
                    <tbody>
                      {diffBreak.map(d => (
                        <tr key={d.d}>
                          <td>
                            <span style={{ color: DIFF_META[d.d].color, fontWeight: 700 }}>
                              {d.d === 'easy' ? '⚡ ' : d.d === 'medium' ? '🔥 ' : '👑 '}
                              {DIFF_META[d.d].label}
                            </span>
                          </td>
                          <td>{d.count}</td>
                          <td style={{ color: DIFF_META[d.d].color, fontWeight: 700 }}>{d.avg}%</td>
                          <td style={{ fontWeight: 600 }}>{d.pass}%</td>
                          <td><BarFill pct={d.avg} color={DIFF_META[d.d].color} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Dimension Report */}
                <div className="adm-card">
                  <h3 className="adm-card-title">📚 By Vocabulary Dimension</h3>
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
                  <h3 className="adm-card-title">📋 Research Summary</h3>
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
                        'Difficulty (easy / medium / hard)',
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
    </div>
  )
}
