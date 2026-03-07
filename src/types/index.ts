// ─── Game ──────────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Dimension =
  | 'Word Recognition'
  | 'Meaning Identification'
  | 'Context Comprehension'
  | 'Word Form'

export interface Choice {
  id: string      // 'A' | 'B' | 'C' | 'D'
  text: string
}

export interface Level {
  number:       number
  dimension:    Dimension
  difficulty:   Difficulty
  accentColor:  string
  bgColor:      string
  letters:      string[]
  targetWord:   string
  hint:         string
  mcqQuestion:  string
  choices:      Choice[]
  correctId:    string
  wordFact:     string
}

export interface DimScore {
  dimension: Dimension
  correct:   number
  total:     number
}

export interface GameRecord {
  id:         string
  playedAt:   string          // ISO timestamp
  score:      number
  total:      number
  pct:        number
  dimScores:  DimScore[]
}

export type GamePhase =
  | 'intro'
  | 'drag'
  | 'mcq'
  | 'results'

// ─── User & Auth ───────────────────────────────────────────────────────────────

export interface User {
  id: string
  fullName: string
  username: string
  email: string
  createdAt: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export interface RegisterData {
  fullName: string
  username: string
  email: string
  password: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<AuthResult>
  register: (data: RegisterData) => Promise<AuthResult>
  logout: () => void
}
