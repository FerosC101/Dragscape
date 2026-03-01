/**
 * DragGame – Wordscapes-style circular letter trace.
 * Uses Pointer Events (mouse + touch) – no HTML5 DnD.
 */

import {
  useState, useRef, useCallback, useEffect, useMemo,
  type CSSProperties,
} from 'react'
import { Star, Lightbulb, ChevronRight, RotateCcw, Home } from 'lucide-react'
import type { Level } from '../../types'
import './dragGame.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE_R   = 30          // half of tile box size (px)
const CIRCLE_R = 108         // radius of circular letter ring (px)
const CSIZE    = (CIRCLE_R + TILE_R + 16) * 2   // circle container px ≈ 308

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tile { id: string; letter: string; x: number; y: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeTiles(letters: string[]): Tile[] {
  const n = letters.length
  return letters.map((letter, i) => {
    const rad = ((360 / n) * i - 90) * (Math.PI / 180)
    return {
      id: `t-${i}`,
      letter,
      x: Math.round(CIRCLE_R * Math.cos(rad)),
      y: Math.round(CIRCLE_R * Math.sin(rad)),
    }
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  level:         Level
  levelIndex:    number
  totalLevels:   number
  score:         number
  onCorrectMcq:  () => void
  onWrongMcq:    () => void
  onExit:        () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DragGame({
  level, levelIndex, totalLevels, score, onCorrectMcq, onWrongMcq, onExit,
}: Props) {

  const tiles = useMemo(() => makeTiles(level.letters), [level])

  const [selIds,      setSelIds]      = useState<string[]>([])
  const [phase,       setPhase]       = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [mcqOpen,     setMcqOpen]     = useState(false)
  const [mcqAnswered, setMcqAnswered] = useState(false)
  const [chosenId,    setChosenId]    = useState<string | null>(null)
  const [hint,        setHint]        = useState(true)

  // ── Responsive circle scale ──────────────────────────────────────────────
  const [circleScale, setCircleScale] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 0
    if (w >= 1400) return 1.65
    if (w >= 1024) return 1.45
    if (w >= 768)  return 1.25
    return 1
  })

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1400)      setCircleScale(1.65)
      else if (w >= 1024) setCircleScale(1.45)
      else if (w >= 768)  setCircleScale(1.25)
      else                setCircleScale(1)
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Refs – avoid stale closures in pointer handlers
  const pressing  = useRef(false)
  const selRef    = useRef<string[]>([])
  const circleRef = useRef<HTMLDivElement>(null)
  const phaseRef  = useRef<'idle' | 'correct' | 'wrong'>('idle')

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase }, [phase])

  // Reset on level change
  useEffect(() => {
    setSelIds([]);  selRef.current = []
    setPhase('idle'); phaseRef.current = 'idle'
    setMcqOpen(false); setMcqAnswered(false)
    setChosenId(null); setHint(false)
    pressing.current = false
  }, [level])

  const formedWord = selIds.map(id => tiles.find(t => t.id === id)!.letter).join('')
  const wordLen    = level.targetWord.length

  // ── Hit test ────────────────────────────────────────────────────────────────
  const tileAt = useCallback((px: number, py: number): Tile | null => {
    const el = circleRef.current
    if (!el) return null
    const r   = el.getBoundingClientRect()
    const cx  = r.left + r.width  / 2
    const cy  = r.top  + r.height / 2
    for (const t of tiles) {
      // t.x / t.y are in pre-scale coordinates; scale them for screen hit test
      const dx = px - (cx + t.x * circleScale)
      const dy = py - (cy + t.y * circleScale)
      if (dx * dx + dy * dy <= ((TILE_R + 10) * circleScale) ** 2) return t
    }
    return null
  }, [tiles, circleScale])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = useCallback((ids: string[]) => {
    const word = ids.map(id => tiles.find(t => t.id === id)!.letter).join('')
    if (word === level.targetWord) {
      setPhase('correct'); phaseRef.current = 'correct'
      setTimeout(() => setMcqOpen(true), 700)
    } else {
      setPhase('wrong'); phaseRef.current = 'wrong'
      setTimeout(() => {
        setSelIds([]); selRef.current = []
        setPhase('idle'); phaseRef.current = 'idle'
      }, 600)
    }
  }, [level.targetWord, tiles])

  // ── Pointer handlers (on circle container) ───────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phaseRef.current !== 'idle') return
    const tile = tileAt(e.clientX, e.clientY)
    if (!tile) return
    e.currentTarget.setPointerCapture(e.pointerId)
    pressing.current = true
    selRef.current = [tile.id]
    setSelIds([tile.id])
  }, [tileAt])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pressing.current || phaseRef.current !== 'idle') return
    const tile = tileAt(e.clientX, e.clientY)
    if (!tile || selRef.current.includes(tile.id)) return
    selRef.current = [...selRef.current, tile.id]
    setSelIds([...selRef.current])
  }, [tileAt])

  const onPointerUp = useCallback(() => {
    if (!pressing.current) return
    pressing.current = false
    const ids = selRef.current
    if (ids.length >= 2) submit(ids)
    else { setSelIds([]); selRef.current = [] }
  }, [submit])

  const onPointerCancel = useCallback(() => {
    pressing.current = false
    selRef.current = []; setSelIds([])
  }, [])

  const clearSel = () => {
    if (phaseRef.current !== 'idle') return
    selRef.current = []; setSelIds([])
  }

  // ── MCQ ─────────────────────────────────────────────────────────────────────
  function handleChoice(id: string) {
    if (mcqAnswered) return
    setChosenId(id); setMcqAnswered(true)
  }
  function handleNext() {
    if (chosenId === level.correctId) onCorrectMcq()
    else onWrongMcq()
  }

  // ── SVG lines between selected tiles ────────────────────────────────────────
  const half = CSIZE / 2

  return (
    <div className="ds-game" style={{ '--accent': level.accentColor } as CSSProperties}>

      {/* ── Sky background ── */}
      <div className="ds-sky" aria-hidden />

      {/* ── HUD ── */}
      <header className="ds-hud">
        <div className="ds-hud-score">
          <Star size={14} fill="currentColor" />
          {score}
        </div>
        <div className="ds-hud-dots">
          {Array.from({ length: totalLevels }).map((_, i) => (
            <span key={i} className={[
              'ds-dot',
              i < levelIndex  ? 'ds-dot--done'   : '',
              i === levelIndex ? 'ds-dot--active' : '',
            ].join(' ')} />
          ))}
        </div>
        <div className="ds-hud-lv">{levelIndex + 1}<span>/</span>{totalLevels}</div>
        <button className="ds-logout-btn" onClick={onExit} title="Back to menu">
          <Home size={14} />
        </button>
      </header>

      {/* ── Game content ── */}
      <div className="ds-content">

      {/* ── Dimension tag ── */}
      <div className="ds-dim-tag">{level.dimension.toUpperCase()}</div>

      {/* ── Answer slots ── */}
      <div
        className={`ds-answer-row${phase === 'wrong' ? ' ds-answer--shake' : ''}`}
        style={{ '--wl': wordLen } as CSSProperties}
      >
        {Array.from({ length: wordLen }).map((_, i) => {
          const ch = phase === 'correct' ? level.targetWord[i] : formedWord[i]
          return (
            <div key={i} className={[
              'ds-slot',
              ch            ? 'ds-slot--filled'  : '',
              phase === 'correct' ? 'ds-slot--green' : '',
            ].join(' ')}>
              <span>{ch ?? ''}</span>
            </div>
          )
        })}
      </div>

      {/* ── Hint ── */}
      <div className="ds-hint-area">
        {hint ? (
          <span className="ds-hint-text">
            <Lightbulb size={12} />{level.hint}
          </span>
        ) : (
          <button className="ds-hint-btn" onClick={() => setHint(true)}>
            <Lightbulb size={12} />Hint
          </button>
        )}
      </div>

      {/* ── Flex spacer ── */}
      <div className="ds-spacer" />

      {/* ── Circular letter ring ── */}
      <div
        ref={circleRef}
        className="ds-circle"
        style={{
          width: CSIZE,
          height: CSIZE,
          touchAction: 'none',
          transform: `scale(${circleScale})`,
          transformOrigin: 'center',
          // compensate so the element takes correct layout space after scale
          marginTop:    `${((circleScale - 1) * CSIZE) / 2}px`,
          marginBottom: `${((circleScale - 1) * CSIZE) / 2}px`,
        } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {/* SVG connection lines */}
        <svg
          className="ds-lines"
          viewBox={`0 0 ${CSIZE} ${CSIZE}`}
          aria-hidden
        >
          {selIds.length > 1 && selIds.map((id, i) => {
            if (i === 0) return null
            const a = tiles.find(t => t.id === selIds[i - 1])!
            const b = tiles.find(t => t.id === id)!
            return (
              <line
                key={`${selIds[i-1]}-${id}`}
                x1={half + a.x} y1={half + a.y}
                x2={half + b.x} y2={half + b.y}
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Letter tiles */}
        {tiles.map(tile => {
          const selIdx = selIds.indexOf(tile.id)
          const isSel  = selIdx !== -1
          return (
            <div
              key={tile.id}
              className={[
                'ds-tile',
                isSel               ? 'ds-tile--sel'     : '',
                phase === 'correct' && isSel ? 'ds-tile--ok'  : '',
                phase === 'wrong'   && isSel ? 'ds-tile--bad' : '',
              ].join(' ')}
              style={{
                left:   half + tile.x - TILE_R,
                top:    half + tile.y - TILE_R,
                width:  TILE_R * 2,
                height: TILE_R * 2,
              } as CSSProperties}
            >
              {tile.letter}
              {isSel && <span className="ds-tile-num">{selIdx + 1}</span>}
            </div>
          )
        })}

        {/* Center formed-word preview */}
        <div className="ds-center-word">
          {formedWord || '···'}
        </div>
      </div>

      {/* ── Clear button ── */}
      <div className="ds-controls">
        <button
          className="ds-clear-btn"
          onClick={clearSel}
          disabled={selIds.length === 0 || phase !== 'idle'}
        >
          <RotateCcw size={14} />
          Clear
        </button>
      </div>

      </div>{/* /ds-content */}

      {/* ── MCQ Panel ── */}
      <div className={`ds-mcq-panel${mcqOpen ? ' ds-mcq--open' : ''}`}>

        {/* Formed word display */}
        <div className="ds-mcq-word">
          {level.targetWord.split('').map((ch, i) => (
            <span key={i} className="ds-mcq-letter">{ch}</span>
          ))}
        </div>

        <p className="ds-mcq-q">{level.mcqQuestion}</p>

        <div className="ds-mcq-choices">
          {level.choices.map(c => {
            const cls = ['ds-choice',
              mcqAnswered && c.id === level.correctId ? 'ds-choice--ok'  : '',
              mcqAnswered && c.id === chosenId && c.id !== level.correctId ? 'ds-choice--bad' : '',
              mcqAnswered && c.id !== level.correctId && c.id !== chosenId ? 'ds-choice--dim' : '',
            ].join(' ')
            return (
              <button key={c.id} className={cls}
                onClick={() => handleChoice(c.id)}
                disabled={mcqAnswered}
              >
                <span className="ds-choice-lbl">{c.id}</span>
                <span className="ds-choice-txt">{c.text}</span>
                {mcqAnswered && c.id === level.correctId && <span className="ds-chk">✓</span>}
                {mcqAnswered && c.id === chosenId && c.id !== level.correctId && <span className="ds-xmark">✗</span>}
              </button>
            )
          })}
        </div>

        {mcqAnswered && (
          <div className="ds-fact">
            <Lightbulb size={16} className="ds-fact-icon" />
            <p>{level.wordFact}</p>
          </div>
        )}

        {mcqAnswered && (
          <button className="ds-next-btn" onClick={handleNext}>
            {levelIndex + 1 < totalLevels
              ? <>Next Level <ChevronRight size={17} /></>
              : <>See Results <ChevronRight size={17} /></>
            }
          </button>
        )}
      </div>
    </div>
  )
}
