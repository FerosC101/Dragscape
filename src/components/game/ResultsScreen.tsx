import { Trophy, Star, RotateCcw, Home, BookOpen, Search, FileText, Type, LogOut, CheckCircle2, XCircle, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Dimension, Level } from '../../types';

const DIM_COLORS: Record<Dimension, string> = {
  'Word Recognition':       '#4ade80',
  'Meaning Identification':  '#a78bfa',
  'Context Comprehension':   '#fbbf24',
  'Word Form':               '#38bdf8',
};
import './resultsScreen.css';

interface Props {
  score: number;
  levels: Level[];
  results: boolean[];
  dimension: Dimension;
  onPlayAgain: () => void;
  onHome:      () => void;
  onViewProfile: () => void;
}

/* Score % → DepEd descriptor */
function getDescriptor(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'OUTSTANDING',         color: '#4ade80' };
  if (pct >= 80) return { label: 'VERY SATISFACTORY',   color: '#86efac' };
  if (pct >= 75) return { label: 'SATISFACTORY',        color: '#fde68a' };
  if (pct >= 60) return { label: 'FAIRLY SATISFACTORY', color: '#fbbf24' };
  return             { label: 'KEEP GOING! 💪',          color: '#fb7185' };
}

function getStars(pct: number): number {
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  if (pct >= 40) return 1;
  return 0;
}

const DIM_META: { key: Dimension; icon: typeof BookOpen; color: string }[] = [
  { key: 'Word Recognition',       icon: BookOpen, color: '#4ade80' },
  { key: 'Meaning Identification',  icon: Search,   color: '#a78bfa' },
  { key: 'Context Comprehension',   icon: FileText, color: '#fbbf24' },
  { key: 'Word Form',               icon: Type,     color: '#38bdf8' },
];

export default function ResultsScreen({ score, levels, results, dimension, onPlayAgain, onHome, onViewProfile }: Props) {
  const { logout } = useAuth();
  const total = levels.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const stars = getStars(pct);
  const descriptor = getDescriptor(pct);

  // Group per-dimension scores
  const dimScores = DIM_META.map(({ key, icon, color }) => {
    let correct = 0;
    let count = 0;
    levels.forEach((lv, i) => {
      if (lv.dimension === key) {
        count++;
        if (results[i]) correct++;
      }
    });
    return { key, icon, color, correct, count };
  }).filter(d => d.count > 0);

  return (
    <div className="rs-root">
      {/* Bokeh */}
      <div className="rs-bokeh-wrap" aria-hidden>
        <div className="rs-bokeh rs-bokeh--1" />
        <div className="rs-bokeh rs-bokeh--2" />
      </div>

      <div className="rs-top-actions">
        <button className="rs-icon-btn" onClick={onViewProfile} title="View Profile">
          <UserCircle2 size={15} />
        </button>
        <button className="rs-icon-btn rs-icon-btn--danger" onClick={logout} title="Logout">
          <LogOut size={15} />
        </button>
      </div>

      <div className="rs-content">
        {/* Dimension badge */}
        <div className="rs-diff-badge" style={{ color: DIM_COLORS[dimension], borderColor: DIM_COLORS[dimension] }}>
          {dimension} · 10 Questions
        </div>

        {/* Trophy */}
        <div className="rs-trophy-wrap">
          <div className="rs-trophy-ring" />
          <Trophy className="rs-trophy-icon" size={52} strokeWidth={1.5} />
        </div>

        {/* Stars */}
        <div className="rs-stars">
          {[0, 1, 2].map(i => (
            <Star
              key={i}
              size={32}
              strokeWidth={1.8}
              className={`rs-star ${i < stars ? 'rs-star--lit' : ''}`}
            />
          ))}
        </div>

        {/* Score */}
        <div className="rs-score-wrap">
          <span className="rs-score-num">{score}</span>
          <span className="rs-score-sep">/</span>
          <span className="rs-score-total">{total}</span>
        </div>

        <div className="rs-pct">{pct}%</div>
        <div className="rs-descriptor" style={{ color: descriptor.color }}>
          {descriptor.label}
        </div>

        {/* Dimension breakdown */}
        <div className="rs-dims">
          <p className="rs-dims-label">Dimension Breakdown</p>
          {dimScores.map(({ key, icon: Icon, color, correct, count }) => {
            const dimPct = Math.round((correct / count) * 100);
            return (
              <div className="rs-dim-row" key={key}>
                <span className="rs-dim-icon" style={{ color }}><Icon size={14} /></span>
                <span className="rs-dim-label">{key}</span>
                <span className="rs-dim-score">
                  <CheckCircle2 size={11} style={{ color: '#4ade80' }} />
                  {correct}
                  <XCircle size={11} style={{ color: '#fb7185', marginLeft: 6 }} />
                  {count - correct}
                  <span className="rs-dim-pct" style={{ color: dimPct >= 75 ? '#4ade80' : dimPct >= 50 ? '#fbbf24' : '#fb7185' }}>
                    {dimPct}%
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="rs-actions">
          <button className="rs-btn rs-btn--home" onClick={onHome}>
            <Home size={17} strokeWidth={2.5} />
            Home
          </button>
          <button className="rs-btn rs-btn--play" onClick={onPlayAgain}>
            <RotateCcw size={17} strokeWidth={2.5} />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
