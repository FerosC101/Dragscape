import { useEffect, useState } from 'react';
import {
  UserCircle2, LogOut, ArrowLeft, Trophy, Star,
  BookOpen, Search, FileText, Type, Loader2, Calendar,
} from 'lucide-react';
import {
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import type { GameRecord, Difficulty, Dimension } from '../../types';
import './profileScreen.css';

interface Props {
  onBack: () => void;
}

const DIFF_META: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: '⚡ Easy',   color: '#4ade80' },
  medium: { label: '🔥 Medium', color: '#fbbf24' },
  hard:   { label: '👑 Hard',   color: '#fb7185' },
};

const DIM_META: Record<Dimension, { icon: typeof BookOpen; color: string }> = {
  'Word Recognition':      { icon: BookOpen, color: '#4ade80' },
  'Meaning Identification': { icon: Search,   color: '#a78bfa' },
  'Context Comprehension':  { icon: FileText, color: '#fbbf24' },
  'Word Form':              { icon: Type,     color: '#38bdf8' },
};

function getStars(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  if (pct >= 40) return 1;
  return 0;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ProfileScreen({ onBack }: Props) {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const ref  = collection(db, 'users', user.id, 'gameHistory');
        const q    = query(ref, orderBy('playedAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => d.data() as GameRecord));
      } catch (err) {
        console.error('[Dragscape] Failed to load game history from Firestore:', err)
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const bestScore = history.length
    ? Math.max(...history.map(r => r.pct))
    : null;

  const avgScore = history.length
    ? Math.round(history.reduce((s, r) => s + r.pct, 0) / history.length)
    : null;

  return (
    <div className="ps-root">
      <div className="ps-bokeh-wrap" aria-hidden>
        <div className="ps-bokeh ps-bokeh--1" />
        <div className="ps-bokeh ps-bokeh--2" />
      </div>

      {/* ── Top bar ── */}
      <header className="ps-topbar">
        <button className="ps-back-btn" onClick={onBack} title="Back to menu">
          <ArrowLeft size={16} />
        </button>
        <span className="ps-topbar-title">Profile</span>
        <button className="ps-icon-btn ps-icon-btn--danger" onClick={logout} title="Logout">
          <LogOut size={15} />
        </button>
      </header>

      <div className="ps-content">

        {/* ── Avatar & name ── */}
        <div className="ps-avatar-section">
          <div className="ps-avatar">
            <UserCircle2 size={52} strokeWidth={1.2} />
          </div>
          <div className="ps-user-info">
            <span className="ps-user-name">{user?.fullName || '—'}</span>
            <span className="ps-user-handle">@{user?.username || '—'}</span>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="ps-stats-row">
          <div className="ps-stat">
            <span className="ps-stat-num">{history.length}</span>
            <span className="ps-stat-label">Games</span>
          </div>
          <div className="ps-stat-sep" />
          <div className="ps-stat">
            <span className="ps-stat-num">{bestScore !== null ? `${bestScore}%` : '—'}</span>
            <span className="ps-stat-label">Best</span>
          </div>
          <div className="ps-stat-sep" />
          <div className="ps-stat">
            <span className="ps-stat-num">{avgScore !== null ? `${avgScore}%` : '—'}</span>
            <span className="ps-stat-label">Average</span>
          </div>
        </div>

        {/* ── History list ── */}
        <div className="ps-history">
          <p className="ps-section-label">GAME HISTORY</p>

          {loading && (
            <div className="ps-loading">
              <Loader2 size={22} className="ps-spinner" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="ps-empty">
              <Trophy size={36} strokeWidth={1.2} />
              <p>No games played yet.</p>
              <p className="ps-empty-sub">Go back and start your first game!</p>
            </div>
          )}

          {!loading && history.map(record => {
            const stars   = getStars(record.pct);
            const diff    = DIFF_META[record.difficulty];
            const pctColor = record.pct >= 75 ? '#4ade80' : record.pct >= 50 ? '#fbbf24' : '#fb7185';

            return (
              <div key={record.id} className="ps-record">
                {/* Row 1: date + difficulty + score */}
                <div className="ps-record-header">
                  <span className="ps-record-date">
                    <Calendar size={11} />
                    {formatDate(record.playedAt)}
                  </span>
                  <span className="ps-record-diff" style={{ color: diff.color }}>
                    {diff.label}
                  </span>
                  <span className="ps-record-pct" style={{ color: pctColor }}>
                    {record.score}/{record.total} · {record.pct}%
                  </span>
                </div>

                {/* Stars */}
                <div className="ps-record-stars">
                  {[0, 1, 2].map(i => (
                    <Star
                      key={i}
                      size={13}
                      strokeWidth={1.8}
                      className={`ps-star ${i < stars ? 'ps-star--lit' : ''}`}
                    />
                  ))}
                </div>

                {/* Dimension breakdown */}
                <div className="ps-record-dims">
                  {record.dimScores.map(ds => {
                    const meta   = DIM_META[ds.dimension];
                    const Icon   = meta.icon;
                    const dpct   = Math.round((ds.correct / ds.total) * 100);
                    const dcolor = dpct >= 75 ? '#4ade80' : dpct >= 50 ? '#fbbf24' : '#fb7185';
                    return (
                      <div key={ds.dimension} className="ps-record-dim">
                        <Icon size={11} style={{ color: meta.color, flexShrink: 0 }} />
                        <span className="ps-record-dim-label">{ds.dimension}</span>
                        <span className="ps-record-dim-pct" style={{ color: dcolor }}>
                          {ds.correct}/{ds.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
