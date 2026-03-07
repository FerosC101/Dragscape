import { useState, useCallback } from 'react'
import { collection, doc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'
import { ALL_LEVELS } from '../../data/levels'
import type { Level, DimScore, Dimension } from '../../types'
import IntroScreen from './IntroScreen'
import DragGame from './DragGame'
import ResultsScreen from './ResultsScreen'
import ProfileScreen from './ProfileScreen'

type Phase = 'intro' | 'playing' | 'results' | 'profile'

// Build per-dimension scores from levels + boolean results array
function buildDimScores(levels: Level[], results: boolean[]): DimScore[] {
  const map = new Map<string, { correct: number; total: number }>()
  levels.forEach((lv, i) => {
    const entry = map.get(lv.dimension) ?? { correct: 0, total: 0 }
    entry.total++
    if (results[i]) entry.correct++
    map.set(lv.dimension, entry)
  })
  return Array.from(map.entries()).map(([dimension, { correct, total }]) => ({
    dimension: dimension as DimScore['dimension'],
    correct,
    total,
  }))
}

export default function GameScreen() {
  const { user } = useAuth()

  const [phase,      setPhase]      = useState<Phase>('intro')
  const [levels,     setLevels]     = useState<Level[]>([])
  const [levelIndex, setLevelIndex] = useState(0)
  const [score,      setScore]      = useState(0)
  const [results,    setResults]    = useState<boolean[]>([])
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null)

  const handleStart = useCallback((dimension: Dimension) => {
    const filtered = ALL_LEVELS.filter(lv => lv.dimension === dimension)
    setSelectedDimension(dimension)
    setLevels(filtered)
    setPhase('playing')
    setLevelIndex(0)
    setScore(0)
    setResults([])
  }, [])

  const advance = useCallback(async (correct: boolean) => {
    const newScore   = correct ? score + 1 : score
    const newResults = [...results, correct]
    const nextIndex  = levelIndex + 1

    if (nextIndex >= levels.length) {
      setScore(newScore)
      setResults(newResults)
      setPhase('results')

      // ── Save record to Firestore ───────────────────────────────
      if (user) {
        try {
          const total     = levels.length
          const pct       = Math.round((newScore / total) * 100)
          const dimScores = buildDimScores(levels, newResults)

          // Generate the document reference first so we have the ID up-front.
          // This avoids the two-step addDoc → updateDoc pattern.
          const histRef = doc(collection(db, 'users', user.id, 'gameHistoryV2'))
          await setDoc(histRef, {
            id:        histRef.id,
            playedAt:  new Date().toISOString(),
            score:     newScore,
            total,
            pct,
            dimScores,
          })
        } catch (err) {
          // Log so the developer can see Firestore write failures in the console
          console.error('[Dragscape] Failed to save game record to Firestore:', err)
        }
      } else {
        console.warn('[Dragscape] Game completed but user is null — record not saved.')
      }
    } else {
      setScore(newScore)
      setResults(newResults)
      setLevelIndex(nextIndex)
    }
  }, [score, levelIndex, levels, results, user])

  const handleCorrectMcq = useCallback(() => advance(true),  [advance])
  const handleWrongMcq   = useCallback(() => advance(false), [advance])

  const handlePlayAgain = useCallback(() => {
    setPhase('intro')
    setLevelIndex(0)
    setScore(0)
    setResults([])
  }, [])

  const handleExit = useCallback(() => {
    setPhase('intro')
    setLevelIndex(0)
    setScore(0)
    setResults([])
  }, [])

  if (phase === 'profile') {
    return <ProfileScreen onBack={() => setPhase('intro')} />
  }

  if (phase === 'intro') {
    return (
      <IntroScreen
        onStart={handleStart}
        onViewProfile={() => setPhase('profile')}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        score={score}
        levels={levels}
        results={results}
        dimension={selectedDimension!}
        onPlayAgain={handlePlayAgain}
        onHome={handleExit}
        onViewProfile={() => setPhase('profile')}
      />
    )
  }

  // phase === 'playing'
  return (
    <DragGame
      key={levelIndex}
      level={levels[levelIndex]}
      levelIndex={levelIndex}
      totalLevels={levels.length}
      score={score}
      onCorrectMcq={handleCorrectMcq}
      onWrongMcq={handleWrongMcq}
      onExit={handleExit}
    />
  )
}

