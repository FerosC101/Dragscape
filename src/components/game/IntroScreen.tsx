import { BookOpen, Search, FileText, Type, Gamepad2, ChevronRight, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Dimension } from '../../types';

import './introScreen.css';

interface Props {
  onStart: (dimension: Dimension) => void;
  onViewProfile: () => void;
}

const DIMENSIONS: { icon: typeof BookOpen; label: Dimension; color: string; desc: string }[] = [
  { icon: BookOpen,  label: 'Word Recognition',       color: '#4ade80', desc: 'Spelling & letter patterns' },
  { icon: Search,    label: 'Meaning Identification',  color: '#a78bfa', desc: 'Definitions & synonyms' },
  { icon: FileText,  label: 'Context Comprehension',   color: '#fbbf24', desc: 'Words in sentences' },
  { icon: Type,      label: 'Word Form',               color: '#38bdf8', desc: 'Correct word usage' },
];

export default function IntroScreen({ onStart, onViewProfile }: Props) {
  const { logout } = useAuth();

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
        <p className="is-subtitle">Choose a dimension to begin your challenge.</p>

        {/* Dimension cards — each one starts that dimension */}
        <p className="is-section-label" style={{ marginBottom: '-0.25rem' }}>SELECT A DIMENSION</p>
        <div className="is-dims">
          {DIMENSIONS.map(({ icon: Icon, label, color, desc }) => (
            <button
              className="is-dim-card is-dim-card--btn"
              key={label}
              onClick={() => onStart(label)}
              style={{ '--dim-color': color } as React.CSSProperties}
            >
              <span className="is-dim-icon" style={{ color }}>
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="is-dim-text">
                <span className="is-dim-label">{label}</span>
                <span className="is-dim-desc">{desc}</span>
              </span>
              <ChevronRight size={14} className="is-dim-arrow" />
            </button>
          ))}
        </div>

        {/* Info strip */}
        <div className="is-info-strip">
          <div className="is-info-item">
            <span className="is-info-num">10</span>
            <span className="is-info-desc">Questions</span>
          </div>
          <div className="is-info-sep" />
          <div className="is-info-item">
            <span className="is-info-num">4</span>
            <span className="is-info-desc">Dimensions</span>
          </div>
          <div className="is-info-sep" />
          <div className="is-info-item">
            <span className="is-info-num">~8</span>
            <span className="is-info-desc">Minutes</span>
          </div>
        </div>

        <p className="is-instructions">
          Drag letters to form the mystery word, then answer a comprehension question.
          Complete all 4 dimensions to master Grade 7 vocabulary.
        </p>
      </div>
    </div>
  );
}
