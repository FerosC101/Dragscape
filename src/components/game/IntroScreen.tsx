import { useState } from 'react';
import { BookOpen, Search, FileText, Type, Gamepad2, ChevronRight, LogOut, Zap, Flame, Crown, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Difficulty } from '../../types';
import { getLevelsByDifficulty } from '../../data/levels';
import './introScreen.css';

interface Props {
  onStart: (difficulty: Difficulty) => void;
  onViewProfile: () => void;
}

const DIMENSIONS = [
  { icon: BookOpen,  label: 'Word Recognition',       color: '#4ade80' },
  { icon: Search,    label: 'Meaning Identification',  color: '#a78bfa' },
  { icon: FileText,  label: 'Context Comprehension',   color: '#fbbf24' },
  { icon: Type,      label: 'Word Form',               color: '#38bdf8' },
];

const DIFFICULTIES: { key: Difficulty; label: string; icon: typeof Zap; desc: string; color: string }[] = [
  { key: 'easy',   label: 'Easy',   icon: Zap,   desc: 'Start here — build confidence',    color: '#4ade80' },
  { key: 'medium', label: 'Medium', icon: Flame, desc: 'Challenge yourself a bit more',    color: '#fbbf24' },
  { key: 'hard',   label: 'Hard',   icon: Crown, desc: 'Prove your vocabulary mastery',    color: '#fb7185' },
];

export default function IntroScreen({ onStart, onViewProfile }: Props) {
  const { logout } = useAuth();
  const [selected, setSelected] = useState<Difficulty>('easy');

  const count = getLevelsByDifficulty(selected).length;

  return (
    <div className="is-root">
      {/* Bokeh */}
      <div className="is-bokeh-wrap" aria-hidden>
        <div className="is-bokeh is-bokeh--1" />
        <div className="is-bokeh is-bokeh--2" />
        <div className="is-bokeh is-bokeh--3" />
      </div>

      <div className="is-top-actions">
        <button className="is-action-btn" onClick={onViewProfile} title="Profile">
          <UserCircle2 size={15} />
        </button>
        <button className="is-action-btn is-action-btn--danger" onClick={logout} title="Logout">
          <LogOut size={15} />
        </button>
      </div>

      <div className="is-content">
        {/* Badge */}
        <div className="is-badge">
          <Gamepad2 size={13} strokeWidth={2.5} />
          Grade 7 · English
        </div>

        {/* Title */}
        <h1 className="is-title">
          <span className="is-title-drag">DRAG</span>
          <span className="is-title-scape">SCAPE</span>
        </h1>
        <p className="is-subtitle">Build words. Master meanings. Level up.</p>

        {/* Dimension cards */}
        <div className="is-dims">
          {DIMENSIONS.map(({ icon: Icon, label, color }) => (
            <div className="is-dim-card" key={label}>
              <span className="is-dim-icon" style={{ color }}>
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="is-dim-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Difficulty picker */}
        <div className="is-difficulty-section">
          <p className="is-section-label">SELECT DIFFICULTY</p>
          <div className="is-difficulty-row">
            {DIFFICULTIES.map(({ key, label, icon: Icon, desc, color }) => (
              <button
                key={key}
                className={`is-diff-btn ${selected === key ? 'is-diff-btn--active' : ''}`}
                style={{ '--diff-color': color } as React.CSSProperties}
                onClick={() => setSelected(key)}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span className="is-diff-label">{label}</span>
                <span className="is-diff-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info strip */}
        <div className="is-info-strip">
          <div className="is-info-item">
            <span className="is-info-num">{count}</span>
            <span className="is-info-desc">Levels</span>
          </div>
          <div className="is-info-sep" />
          <div className="is-info-item">
            <span className="is-info-num">4</span>
            <span className="is-info-desc">Dimensions</span>
          </div>
          <div className="is-info-sep" />
          <div className="is-info-item">
            <span className="is-info-num">~{Math.ceil(count * 0.75)}</span>
            <span className="is-info-desc">Minutes</span>
          </div>
        </div>

        {/* Start button */}
        <button className="is-start-btn" onClick={() => onStart(selected)}>
          Start Playing
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

        <p className="is-instructions">
          Drag letters to form the mystery word, then answer a comprehension question.
          All four vocabulary dimensions are tested at your chosen difficulty.
        </p>
      </div>
    </div>
  );
}
