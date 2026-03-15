import type { Level, Difficulty } from '../types'

// ─── Dimension color palettes ─────────────────────────────────────────────────
// Word Recognition    → greens
// Meaning Identification → purples
// Context Comprehension  → warm ambers / pinks
// Word Form              → blues / teals

// ─── Helper: get colors for difficulty within each dimension ─────────────────
function dimColors(dim: 'wr' | 'mi' | 'cc' | 'wf', diff: Difficulty) {
  const map = {
    wr: {
      easy:   { accent: '#4ade80', bg: '#0a1f0f' },
      medium: { accent: '#22c55e', bg: '#0d2614' },
      hard:   { accent: '#16a34a', bg: '#112d19' },
    },
    mi: {
      easy:   { accent: '#a78bfa', bg: '#0e0a1f' },
      medium: { accent: '#8b5cf6', bg: '#120c24' },
      hard:   { accent: '#7c3aed', bg: '#160e2a' },
    },
    cc: {
      easy:   { accent: '#fbbf24', bg: '#1a1200' },
      medium: { accent: '#f59e0b', bg: '#1c1400' },
      hard:   { accent: '#fb7185', bg: '#1a070a' },
    },
    wf: {
      easy:   { accent: '#38bdf8', bg: '#050f1a' },
      medium: { accent: '#0ea5e9', bg: '#071420' },
      hard:   { accent: '#2dd4bf', bg: '#041512' },
    },
  }
  return map[dim][diff]
}

// ─── Seeded Fisher-Yates shuffle – deterministic scramble per level number ──────
function scramble(word: string, seed: number): string[] {
  const arr = word.split('')
  let s = seed
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  // Guard: if shuffle produced the original word, rotate one position
  if (arr.join('') === word) arr.push(arr.shift()!)
  return arr
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ALL 40 LEVELS
// ═══════════════════════════════════════════════════════════════════════════════

export const ALL_LEVELS: Level[] = [

  // ╔═══════════════════════════════════════════════════════════════════════════
  // ║  PART I: WORD RECOGNITION (10 items)
  // ╚═══════════════════════════════════════════════════════════════════════════

  // ── Easy (1-4) ─────────────────────────────────────────────────────────────
  {
    number: 1,
    dimension: 'Word Recognition',
    difficulty: 'easy',
    accentColor: dimColors('wr', 'easy').accent,
    bgColor: dimColors('wr', 'easy').bg,
    letters: ['G', 'N', 'I', 'V', 'R', 'A', 'T', 'S'],
    targetWord: 'STARVING',
    hint: 'Like missing breakfast, lunch, and dinner all at once',
    mcqQuestion: 'Anna skipped breakfast and lunch. By dinner time, her stomach was growling loudly. Which word best describes Anna\'s feeling?',
    choices: [
      { id: 'A', text: 'Tired' },
      { id: 'B', text: 'Starving' },
      { id: 'C', text: 'Sleepy' },
      { id: 'D', text: 'Angry' },
    ],
    correctId: 'B',
    wordFact: '"Starving" comes from Old English \'steorfan\' meaning to die. Over time it evolved to mean extreme hunger.',
  },
  {
    number: 2,
    dimension: 'Word Recognition',
    difficulty: 'easy',
    accentColor: dimColors('wr', 'easy').accent,
    bgColor: dimColors('wr', 'easy').bg,
    letters: ['T', 'N', 'E', 'I', 'C', 'N', 'A'],
    targetWord: 'ANCIENT',
    hint: 'Dinosaurs and pyramids belong to these times',
    mcqQuestion: 'The teacher showed a photograph of a stone building built thousands of years ago. Which word best describes it?',
    choices: [
      { id: 'A', text: 'Very old' },
      { id: 'B', text: 'Very new' },
      { id: 'C', text: 'Very small' },
      { id: 'D', text: 'Very big' },
    ],
    correctId: 'A',
    wordFact: '"Ancient" comes from Latin \'ante\' meaning \'before.\' It refers to things from a very long time ago.',
  },
  {
    number: 3,
    dimension: 'Word Recognition',
    difficulty: 'easy',
    accentColor: dimColors('wr', 'easy').accent,
    bgColor: dimColors('wr', 'easy').bg,
    letters: ['O', 'C', 'U', 'R', 'A', 'G', 'E', 'O', 'U', 'S'],
    targetWord: 'COURAGEOUS',
    hint: 'A firefighter running into a burning building shows this',
    mcqQuestion: 'Marco helped guide younger students during an earthquake drill even though he was scared. Which word best describes him?',
    choices: [
      { id: 'A', text: 'Coward' },
      { id: 'B', text: 'Afraid' },
      { id: 'C', text: 'Courageous' },
      { id: 'D', text: 'Weak' },
    ],
    correctId: 'C',
    wordFact: '"Courageous" comes from French \'courage\' meaning heart. Being courageous means acting with heart despite fear.',
  },
  {
    number: 4,
    dimension: 'Word Recognition',
    difficulty: 'easy',
    accentColor: dimColors('wr', 'easy').accent,
    bgColor: dimColors('wr', 'easy').bg,
    letters: ['H', 'U', 'G', 'E'],
    targetWord: 'HUGE',
    hint: 'Think of a blue whale, a cargo ship, or a skyscraper',
    mcqQuestion: 'The billboard covered the entire side of a five-story building. Which word best describes it?',
    choices: [
      { id: 'A', text: 'Very tiny' },
      { id: 'B', text: 'Very huge' },
      { id: 'C', text: 'Very fast' },
      { id: 'D', text: 'Very slow' },
    ],
    correctId: 'B',
    wordFact: '"Huge" comes from Old French \'ahuge\' meaning enormous. It describes something far larger than normal.',
  },

  // ── Medium (5-7) ──────────────────────────────────────────────────────────
  {
    number: 5,
    dimension: 'Word Recognition',
    difficulty: 'medium',
    accentColor: dimColors('wr', 'medium').accent,
    bgColor: dimColors('wr', 'medium').bg,
    letters: ['E', 'X', 'A', 'M', 'I', 'N', 'E'],
    targetWord: 'EXAMINE',
    hint: 'What a doctor does with a stethoscope and flashlight',
    mcqQuestion: 'The science teacher carefully checked every measurement and observation. Which word best describes what she did?',
    choices: [
      { id: 'A', text: 'Ignore' },
      { id: 'B', text: 'Examine' },
      { id: 'C', text: 'Forget' },
      { id: 'D', text: 'Avoid' },
    ],
    correctId: 'B',
    wordFact: '"Examine" comes from Latin \'examinare\' meaning to weigh or test. It implies careful, thorough inspection.',
  },
  {
    number: 6,
    dimension: 'Word Recognition',
    difficulty: 'medium',
    accentColor: dimColors('wr', 'medium').accent,
    bgColor: dimColors('wr', 'medium').bg,
    letters: ['T', 'R', 'A', 'N', 'S', 'P', 'A', 'R', 'E', 'N', 'T'],
    targetWord: 'TRANSPARENT',
    hint: 'Glass windows and clear plastic wrap have this property',
    mcqQuestion: 'The stage curtain let the audience see the shadows of actors. Which word best describes it?',
    choices: [
      { id: 'A', text: 'Can be heard' },
      { id: 'B', text: 'Can be seen through' },
      { id: 'C', text: 'Can be touched' },
      { id: 'D', text: 'Can be tasted' },
    ],
    correctId: 'B',
    wordFact: '"Transparent" comes from Latin \'trans\' (through) + \'parere\' (to appear). Something transparent can be seen through.',
  },
  {
    number: 7,
    dimension: 'Word Recognition',
    difficulty: 'medium',
    accentColor: dimColors('wr', 'medium').accent,
    bgColor: dimColors('wr', 'medium').bg,
    letters: ['A', 'N', 'N', 'U', 'A', 'L'],
    targetWord: 'ANNUAL',
    hint: 'Birthdays, Christmas, and New Year all happen on this schedule',
    mcqQuestion: 'Every December 25, the Reyes family gathers for a reunion — without fail for 20 years. How often does this happen?',
    choices: [
      { id: 'A', text: 'Daily' },
      { id: 'B', text: 'Weekly' },
      { id: 'C', text: 'Monthly' },
      { id: 'D', text: 'Annual' },
    ],
    correctId: 'D',
    wordFact: '"Annual" comes from Latin \'annualis\' meaning yearly. Annual events occur once every year.',
  },

  // ── Hard (8-10) ───────────────────────────────────────────────────────────
  {
    number: 8,
    dimension: 'Word Recognition',
    difficulty: 'hard',
    accentColor: dimColors('wr', 'hard').accent,
    bgColor: dimColors('wr', 'hard').bg,
    letters: ['R', 'A', 'P', 'I', 'D'],
    targetWord: 'RAPID',
    hint: 'Lightning, a cheetah, and a bullet train all share this quality',
    mcqQuestion: 'The ambulance driver turned on the siren and drove through traffic at full speed. Which word describes the ambulance?',
    choices: [
      { id: 'A', text: 'Very slow' },
      { id: 'B', text: 'Very fast' },
      { id: 'C', text: 'Very quiet' },
      { id: 'D', text: 'Very loud' },
    ],
    correctId: 'B',
    wordFact: '"Rapid" comes from Latin \'rapidus\' meaning swift or hurried. Something rapid moves with great speed.',
  },
  {
    number: 9,
    dimension: 'Word Recognition',
    difficulty: 'hard',
    accentColor: dimColors('wr', 'hard').accent,
    bgColor: dimColors('wr', 'hard').bg,
    letters: ['I', 'M', 'P', 'R', 'O', 'V', 'E'],
    targetWord: 'IMPROVE',
    hint: 'What practice and feedback do to a skill over time',
    mcqQuestion: 'The school added after-school tutoring to boost struggling students\' grades. What was the program meant to do?',
    choices: [
      { id: 'A', text: 'Worsen' },
      { id: 'B', text: 'Improve' },
      { id: 'C', text: 'Destroy' },
      { id: 'D', text: 'Break' },
    ],
    correctId: 'B',
    wordFact: '"Improve" comes from Old French \'emprower\' meaning to turn to profit. To improve is to make something better.',
  },
  {
    number: 10,
    dimension: 'Word Recognition',
    difficulty: 'hard',
    accentColor: dimColors('wr', 'hard').accent,
    bgColor: dimColors('wr', 'hard').bg,
    letters: ['G', 'E', 'N', 'E', 'R', 'O', 'U', 'S'],
    targetWord: 'GENEROUS',
    hint: 'Someone who shares the last piece of food without hesitation',
    mcqQuestion: 'Mang Danny donated 50 bags of rice and 100 cans of goods during typhoon relief. Which word best describes him?',
    choices: [
      { id: 'A', text: 'Selfish' },
      { id: 'B', text: 'Mean' },
      { id: 'C', text: 'Giving' },
      { id: 'D', text: 'Taking' },
    ],
    correctId: 'C',
    wordFact: '"Generous" comes from Latin \'generosus\' meaning of noble birth. Today it means being willing to give more than expected.',
  },

  // ╔═══════════════════════════════════════════════════════════════════════════
  // ║  PART II: MEANING IDENTIFICATION (10 items)
  // ╚═══════════════════════════════════════════════════════════════════════════

  // ── Easy (11-13) ──────────────────────────────────────────────────────────
  {
    number: 11,
    dimension: 'Meaning Identification',
    difficulty: 'easy',
    accentColor: dimColors('mi', 'easy').accent,
    bgColor: dimColors('mi', 'easy').bg,
    letters: ['N', 'O', 'D', 'N', 'A', 'B', 'A'],
    targetWord: 'ABANDON',
    hint: 'A captain is the last to do this to a sinking ship',
    mcqQuestion: 'Pedro left his old bicycle behind when his family moved. He never went back to get it. Which meaning best fits?',
    choices: [
      { id: 'A', text: 'To leave behind permanently' },
      { id: 'B', text: 'To bring something along' },
      { id: 'C', text: 'To keep something safe' },
      { id: 'D', text: 'To find something lost' },
    ],
    correctId: 'A',
    wordFact: '"Abandon" comes from Old French \'abandonner\' — to give up control. It expresses leaving with no intention to return.',
  },
  {
    number: 12,
    dimension: 'Meaning Identification',
    difficulty: 'easy',
    accentColor: dimColors('mi', 'easy').accent,
    bgColor: dimColors('mi', 'easy').bg,
    letters: ['B', 'R', 'I', 'L', 'L', 'I', 'A', 'N', 'T'],
    targetWord: 'BRILLIANT',
    hint: 'Einstein, Rizal, and Marie Curie were all described this way',
    mcqQuestion: 'Sarah\'s science fair idea was so creative and well-researched that her teacher called it outstanding. Which meaning fits?',
    choices: [
      { id: 'A', text: 'Very dull and dark' },
      { id: 'B', text: 'Very bright or intelligent' },
      { id: 'C', text: 'Very ordinary' },
      { id: 'D', text: 'Very confused' },
    ],
    correctId: 'B',
    wordFact: '"Brilliant" comes from French \'brillant\' meaning shining. It describes something that shines — intellectually or literally.',
  },
  {
    number: 13,
    dimension: 'Meaning Identification',
    difficulty: 'easy',
    accentColor: dimColors('mi', 'easy').accent,
    bgColor: dimColors('mi', 'easy').bg,
    letters: ['C', 'A', 'U', 'T', 'I', 'O', 'U', 'S'],
    targetWord: 'CAUTIOUS',
    hint: 'How you should move near a sleeping dog or on a slippery floor',
    mcqQuestion: 'Ben looked left and right three times and waited for a green light before crossing. Which meaning best describes Ben?',
    choices: [
      { id: 'A', text: 'Careless and reckless' },
      { id: 'B', text: 'Careful and alert' },
      { id: 'C', text: 'Lazy and slow' },
      { id: 'D', text: 'Quick and hasty' },
    ],
    correctId: 'B',
    wordFact: '"Cautious" comes from Latin \'cautio\' meaning caution. A cautious person thinks carefully before acting.',
  },

  // ── Medium (14-17) ────────────────────────────────────────────────────────
  {
    number: 14,
    dimension: 'Meaning Identification',
    difficulty: 'medium',
    accentColor: dimColors('mi', 'medium').accent,
    bgColor: dimColors('mi', 'medium').bg,
    letters: ['F', 'R', 'A', 'G', 'I', 'L', 'E'],
    targetWord: 'FRAGILE',
    hint: 'The word printed on delivery boxes with a wine glass icon',
    mcqQuestion: 'The antique glass vase was placed inside a locked cabinet because even a slight bump could shatter it. Which meaning fits?',
    choices: [
      { id: 'A', text: 'Strong and tough' },
      { id: 'B', text: 'Rough and hard' },
      { id: 'C', text: 'Fragile and easily broken' },
      { id: 'D', text: 'Heavy and solid' },
    ],
    correctId: 'C',
    wordFact: '"Fragile" comes from Latin \'fragilis\' meaning breakable. Handle with care — it might not survive a bump.',
  },
  {
    number: 15,
    dimension: 'Meaning Identification',
    difficulty: 'medium',
    accentColor: dimColors('mi', 'medium').accent,
    bgColor: dimColors('mi', 'medium').bg,
    letters: ['E', 'V', 'I', 'D', 'E', 'N', 'C', 'E'],
    targetWord: 'EVIDENCE',
    hint: 'What Sherlock Holmes always hunts for at the scene',
    mcqQuestion: 'The detective found a footprint, torn cloth, and a recorded video that all pointed to the same suspect. What were those items?',
    choices: [
      { id: 'A', text: 'Something that proves or disproves' },
      { id: 'B', text: 'Something that is hidden' },
      { id: 'C', text: 'Something that is forgotten' },
      { id: 'D', text: 'Something that is imaginary' },
    ],
    correctId: 'A',
    wordFact: '"Evidence" comes from Latin \'evidentia\' meaning obvious. Evidence makes something plain or clear.',
  },
  {
    number: 16,
    dimension: 'Meaning Identification',
    difficulty: 'medium',
    accentColor: dimColors('mi', 'medium').accent,
    bgColor: dimColors('mi', 'medium').bg,
    letters: ['F', 'R', 'E', 'Q', 'U', 'E', 'N', 'T'],
    targetWord: 'FREQUENT',
    hint: 'Philippine rain in July falls this often',
    mcqQuestion: 'The school canteen runs out of rice every single day. Which meaning best describes how often it happens?',
    choices: [
      { id: 'A', text: 'Happening rarely' },
      { id: 'B', text: 'Happening often' },
      { id: 'C', text: 'Never happening' },
      { id: 'D', text: 'Happening once' },
    ],
    correctId: 'B',
    wordFact: '"Frequent" comes from Latin \'frequens\' meaning crowded or repeated. Something frequent happens many times.',
  },
  {
    number: 17,
    dimension: 'Meaning Identification',
    difficulty: 'medium',
    accentColor: dimColors('mi', 'medium').accent,
    bgColor: dimColors('mi', 'medium').bg,
    letters: ['N', 'U', 'I', 'E', 'G', 'N', 'E'],
    targetWord: 'GENUINE',
    hint: 'The opposite of counterfeit, fake, or imitation',
    mcqQuestion: 'The seller showed a receipt and official certificate proving the bag was made in Italy. Which meaning fits?',
    choices: [
      { id: 'A', text: 'Fake or false' },
      { id: 'B', text: 'Real or authentic' },
      { id: 'C', text: 'Temporary' },
      { id: 'D', text: 'Uncertain' },
    ],
    correctId: 'B',
    wordFact: '"Genuine" comes from Latin \'genuinus\' meaning natural or native. Something genuine is the real deal.',
  },

  // ── Hard (18-20) ──────────────────────────────────────────────────────────
  {
    number: 18,
    dimension: 'Meaning Identification',
    difficulty: 'hard',
    accentColor: dimColors('mi', 'hard').accent,
    bgColor: dimColors('mi', 'hard').bg,
    letters: ['H', 'A', 'R', 'S', 'H'],
    targetWord: 'HARSH',
    hint: 'Bitter medicine, freezing wind, and strict scolding all feel this way',
    mcqQuestion: 'The principal used a strict and firm tone when reminding students about bullying consequences. Which meaning fits?',
    choices: [
      { id: 'A', text: 'Gentle and soft' },
      { id: 'B', text: 'Rough or severe' },
      { id: 'C', text: 'Quiet and calm' },
      { id: 'D', text: 'Sweet and pleasant' },
    ],
    correctId: 'B',
    wordFact: '"Harsh" comes from Middle English \'harsk\' meaning rough. Something harsh is unpleasantly severe.',
  },
  {
    number: 19,
    dimension: 'Meaning Identification',
    difficulty: 'hard',
    accentColor: dimColors('mi', 'hard').accent,
    bgColor: dimColors('mi', 'hard').bg,
    letters: ['I', 'L', 'L', 'U', 'M', 'I', 'N', 'A', 'T', 'E'],
    targetWord: 'ILLUMINATE',
    hint: 'What a lighthouse does for ships lost in the dark',
    mcqQuestion: 'The barangay placed solar-powered streetlights along a dark alley so residents could walk safely. What did the lights do?',
    choices: [
      { id: 'A', text: 'To make dark' },
      { id: 'B', text: 'To make bright' },
      { id: 'C', text: 'To make loud' },
      { id: 'D', text: 'To make quiet' },
    ],
    correctId: 'B',
    wordFact: '"Illuminate" comes from Latin \'illuminare\' meaning to light up. To illuminate is to bring light where there was none.',
  },
  {
    number: 20,
    dimension: 'Meaning Identification',
    difficulty: 'hard',
    accentColor: dimColors('mi', 'hard').accent,
    bgColor: dimColors('mi', 'hard').bg,
    letters: ['J', 'O', 'Y', 'F', 'U', 'L'],
    targetWord: 'JOYFUL',
    hint: 'The look on a child\'s face on Christmas morning',
    mcqQuestion: 'The students cheered, laughed, and danced during the school foundation day. Which meaning best describes their mood?',
    choices: [
      { id: 'A', text: 'Full of sadness' },
      { id: 'B', text: 'Full of anger' },
      { id: 'C', text: 'Full of happiness' },
      { id: 'D', text: 'Full of fear' },
    ],
    correctId: 'C',
    wordFact: '"Joyful" combines \'joy\' from Latin \'gaudia\' (gladness) with \'-ful\' meaning full of. A joyful person overflows with happiness.',
  },

  // ╔═══════════════════════════════════════════════════════════════════════════
  // ║  PART III: CONTEXT COMPREHENSION / WORD USAGE (10 items)
  // ╚═══════════════════════════════════════════════════════════════════════════

  // ── Easy (21-23) ──────────────────────────────────────────────────────────
  {
    number: 21,
    dimension: 'Context Comprehension',
    difficulty: 'easy',
    accentColor: dimColors('cc', 'easy').accent,
    bgColor: dimColors('cc', 'easy').bg,
    letters: ['C', 'O', 'N', 'F', 'I', 'D', 'E', 'N', 'T'],
    targetWord: 'CONFIDENT',
    hint: 'How you feel after thoroughly preparing for something',
    mcqQuestion: 'Clara spent two weeks reviewing. She was __________ about the test because she studied very hard.',
    choices: [
      { id: 'A', text: 'Worried' },
      { id: 'B', text: 'Confident' },
      { id: 'C', text: 'Confused' },
      { id: 'D', text: 'Angry' },
    ],
    correctId: 'B',
    wordFact: '"Confident" comes from Latin \'confidere\' — to trust fully. A confident person believes in their own abilities.',
  },
  {
    number: 22,
    dimension: 'Context Comprehension',
    difficulty: 'easy',
    accentColor: dimColors('cc', 'easy').accent,
    bgColor: dimColors('cc', 'easy').bg,
    letters: ['I', 'D', 'E', 'N', 'T', 'I', 'F', 'Y'],
    targetWord: 'IDENTIFY',
    hint: 'What fingerprint analysts do to find the right suspect',
    mcqQuestion: 'The teacher asked students to read twice, then write the author\'s main message. She asked them to __________ the main idea.',
    choices: [
      { id: 'A', text: 'Forget' },
      { id: 'B', text: 'Ignore' },
      { id: 'C', text: 'Identify' },
      { id: 'D', text: 'Avoid' },
    ],
    correctId: 'C',
    wordFact: '"Identify" comes from Latin \'identificare\' meaning to make the same. To identify something is to recognize what it is.',
  },
  {
    number: 23,
    dimension: 'Context Comprehension',
    difficulty: 'easy',
    accentColor: dimColors('cc', 'easy').accent,
    bgColor: dimColors('cc', 'easy').bg,
    letters: ['E', 'X', 'H', 'A', 'U', 'S', 'T', 'E', 'D'],
    targetWord: 'EXHAUSTED',
    hint: 'How a marathon runner feels at the finish line',
    mcqQuestion: 'After the 42-kilometer race, Maria could barely walk. She felt __________ and needed to rest.',
    choices: [
      { id: 'A', text: 'Energetic' },
      { id: 'B', text: 'Exhausted' },
      { id: 'C', text: 'Excited' },
      { id: 'D', text: 'Angry' },
    ],
    correctId: 'B',
    wordFact: '"Exhausted" comes from Latin \'exhaurire\' — to drain completely. When you\'re exhausted, your energy is fully used up.',
  },

  // ── Medium (24-27) ────────────────────────────────────────────────────────
  {
    number: 24,
    dimension: 'Context Comprehension',
    difficulty: 'medium',
    accentColor: dimColors('cc', 'medium').accent,
    bgColor: dimColors('cc', 'medium').bg,
    letters: ['C', 'O', 'N', 'F', 'U', 'S', 'I', 'N', 'G'],
    targetWord: 'CONFUSING',
    hint: 'Assembly instructions with no pictures and lots of jargon feel this way',
    mcqQuestion: 'The worksheet used overly technical language with no examples. The __________ instructions made it difficult for students.',
    choices: [
      { id: 'A', text: 'Clear' },
      { id: 'B', text: 'Simple' },
      { id: 'C', text: 'Confusing' },
      { id: 'D', text: 'Helpful' },
    ],
    correctId: 'C',
    wordFact: '"Confusing" comes from Latin \'confundere\' meaning to mix together. Confusing things jumble your understanding.',
  },
  {
    number: 25,
    dimension: 'Context Comprehension',
    difficulty: 'medium',
    accentColor: dimColors('cc', 'medium').accent,
    bgColor: dimColors('cc', 'medium').bg,
    letters: ['K', 'I', 'N', 'D', 'N', 'E', 'S', 'S'],
    targetWord: 'KINDNESS',
    hint: 'A random act of this can brighten a stranger\'s entire day',
    mcqQuestion: 'Juan offered his umbrella to an elderly woman in the rain. He showed great __________ when he helped her.',
    choices: [
      { id: 'A', text: 'Rudeness' },
      { id: 'B', text: 'Kindness' },
      { id: 'C', text: 'Anger' },
      { id: 'D', text: 'Laziness' },
    ],
    correctId: 'B',
    wordFact: '"Kindness" comes from Old English \'cynde\' meaning nature or family. Being kind is acting from your best nature.',
  },
  {
    number: 26,
    dimension: 'Context Comprehension',
    difficulty: 'medium',
    accentColor: dimColors('cc', 'medium').accent,
    bgColor: dimColors('cc', 'medium').bg,
    letters: ['D', 'I', 'S', 'C', 'O', 'V', 'E', 'R', 'Y'],
    targetWord: 'DISCOVERY',
    hint: 'Fleming\'s penicillin and Newton\'s gravity are famous ones',
    mcqQuestion: 'Filipino researchers announced a new vaccine formula that could prevent a deadly disease. They made an important __________.',
    choices: [
      { id: 'A', text: 'Mistake' },
      { id: 'B', text: 'Discovery' },
      { id: 'C', text: 'Problem' },
      { id: 'D', text: 'Failure' },
    ],
    correctId: 'B',
    wordFact: '"Discovery" combines \'dis-\' (un-) and \'cover\' — literally to uncover. A discovery reveals something previously unknown.',
  },
  {
    number: 27,
    dimension: 'Context Comprehension',
    difficulty: 'medium',
    accentColor: dimColors('cc', 'medium').accent,
    bgColor: dimColors('cc', 'medium').bg,
    letters: ['D', 'I', 'F', 'F', 'I', 'C', 'U', 'L', 'T'],
    targetWord: 'DIFFICULT',
    hint: 'Climbing Mount Everest qualifies as this kind of challenge',
    mcqQuestion: 'The mountain climbers battled freezing temperatures, thick fog, and steep cliffs. They faced many __________ challenges.',
    choices: [
      { id: 'A', text: 'Easy' },
      { id: 'B', text: 'Simple' },
      { id: 'C', text: 'Difficult' },
      { id: 'D', text: 'Pleasant' },
    ],
    correctId: 'C',
    wordFact: '"Difficult" comes from Latin \'difficilis\' meaning not easy. A difficult task demands extra effort and persistence.',
  },

  // ── Hard (28-30) ──────────────────────────────────────────────────────────
  {
    number: 28,
    dimension: 'Context Comprehension',
    difficulty: 'hard',
    accentColor: dimColors('cc', 'hard').accent,
    bgColor: dimColors('cc', 'hard').bg,
    letters: ['A', 'N', 'N', 'O', 'U', 'N', 'C', 'E'],
    targetWord: 'ANNOUNCE',
    hint: 'What a principal does over the PA system to share news',
    mcqQuestion: 'The principal gathered students in the gymnasium to share the updated rules. The principal will __________ the new rules.',
    choices: [
      { id: 'A', text: 'Hide' },
      { id: 'B', text: 'Announce' },
      { id: 'C', text: 'Forget' },
      { id: 'D', text: 'Ignore' },
    ],
    correctId: 'B',
    wordFact: '"Announce" comes from Latin \'annuntiare\' meaning to report. To announce is to make something known publicly.',
  },
  {
    number: 29,
    dimension: 'Context Comprehension',
    difficulty: 'hard',
    accentColor: dimColors('cc', 'hard').accent,
    bgColor: dimColors('cc', 'hard').bg,
    letters: ['B', 'E', 'A', 'U', 'T', 'I', 'F', 'U', 'L'],
    targetWord: 'BEAUTIFUL',
    hint: 'A sunset over the ocean is almost always described this way',
    mcqQuestion: 'Visitors stopped and gathered in front of one painting — some took photos of how stunning it was. The painting was so __________.',
    choices: [
      { id: 'A', text: 'Ugly' },
      { id: 'B', text: 'Ordinary' },
      { id: 'C', text: 'Beautiful' },
      { id: 'D', text: 'Boring' },
    ],
    correctId: 'C',
    wordFact: '"Beautiful" comes from \'beauty\' (Old French \'beaute\') + \'-ful.\' Something beautiful fills the viewer with admiration.',
  },
  {
    number: 30,
    dimension: 'Context Comprehension',
    difficulty: 'hard',
    accentColor: dimColors('cc', 'hard').accent,
    bgColor: dimColors('cc', 'hard').bg,
    letters: ['U', 'T', 'I', 'L', 'I', 'Z', 'E'],
    targetWord: 'UTILIZE',
    hint: 'What a skilled engineer does even with limited tools and materials',
    mcqQuestion: 'The guidance office had limited funds and supplies, so they planned carefully. We need to __________ our resources wisely.',
    choices: [
      { id: 'A', text: 'Waste' },
      { id: 'B', text: 'Utilize' },
      { id: 'C', text: 'Destroy' },
      { id: 'D', text: 'Hide' },
    ],
    correctId: 'B',
    wordFact: '"Utilize" comes from French \'utiliser\' meaning to make useful. To utilize resources is to use them effectively.',
  },

  // ╔═══════════════════════════════════════════════════════════════════════════
  // ║  PART IV: WORD FORM (10 items)
  // ╚═══════════════════════════════════════════════════════════════════════════

  // ── Easy (31-33) ──────────────────────────────────────────────────────────
  {
    number: 31,
    dimension: 'Word Form',
    difficulty: 'easy',
    accentColor: dimColors('wf', 'easy').accent,
    bgColor: dimColors('wf', 'easy').bg,
    letters: ['E', 'X', 'P', 'L', 'A', 'N', 'A', 'T', 'I', 'O', 'N'],
    targetWord: 'EXPLANATION',
    hint: 'Noun from \'explain\' — watch how the spelling shifts before -ation',
    mcqQuestion: 'After solving the math problem step by step on the board, the teacher gave the students a detailed __________ of each solution.',
    choices: [
      { id: 'A', text: 'Explain' },
      { id: 'B', text: 'Explanation' },
      { id: 'C', text: 'Explaining' },
      { id: 'D', text: 'Explained' },
    ],
    correctId: 'B',
    wordFact: '"Explanation" is the noun form of \'explain.\' Notice the root changes from \'-ain\' to \'-an-\' when forming the noun.',
  },
  {
    number: 32,
    dimension: 'Word Form',
    difficulty: 'easy',
    accentColor: dimColors('wf', 'easy').accent,
    bgColor: dimColors('wf', 'easy').bg,
    letters: ['H', 'A', 'P', 'P', 'I', 'N', 'E', 'S', 'S'],
    targetWord: 'HAPPINESS',
    hint: 'When \'happy\' becomes a noun, the Y changes to I before -ness',
    mcqQuestion: 'Maria worked hard throughout the season and trained every day. When she finally won the championship, she was filled with __________.',
    choices: [
      { id: 'A', text: 'Happy' },
      { id: 'B', text: 'Happiness' },
      { id: 'C', text: 'Happily' },
      { id: 'D', text: 'Happier' },
    ],
    correctId: 'B',
    wordFact: '"Happiness" is formed by replacing the \'y\' in happy with \'i\' before adding -ness. This follows a common English spelling rule.',
  },
  {
    number: 33,
    dimension: 'Word Form',
    difficulty: 'easy',
    accentColor: dimColors('wf', 'easy').accent,
    bgColor: dimColors('wf', 'easy').bg,
    letters: ['D', 'E', 'T', 'E', 'R', 'M', 'I', 'N', 'A', 'T', 'I', 'O', 'N'],
    targetWord: 'DETERMINATION',
    hint: 'Noun from \'determine\' — the final E is dropped before -ation',
    mcqQuestion: 'Even after failing the qualifying exam twice, the student refused to give up. Everyone admired her __________.',
    choices: [
      { id: 'A', text: 'Determine' },
      { id: 'B', text: 'Determined' },
      { id: 'C', text: 'Determination' },
      { id: 'D', text: 'Determining' },
    ],
    correctId: 'C',
    wordFact: '"Determination" comes from \'determine\' + \'-ation.\' The \'e\' is dropped before adding the suffix.',
  },

  // ── Medium (34-37) ────────────────────────────────────────────────────────
  {
    number: 34,
    dimension: 'Word Form',
    difficulty: 'medium',
    accentColor: dimColors('wf', 'medium').accent,
    bgColor: dimColors('wf', 'medium').bg,
    letters: ['N', 'E', 'C', 'E', 'S', 'S', 'A', 'R', 'Y'],
    targetWord: 'NECESSARY',
    hint: 'One collar, two socks — remember: one C but two S\'s',
    mcqQuestion: 'The school handbook states that it is __________ for students to wear their complete uniform every day.',
    choices: [
      { id: 'A', text: 'Necessity' },
      { id: 'B', text: 'Necessary' },
      { id: 'C', text: 'Necessarily' },
      { id: 'D', text: 'Necessitate' },
    ],
    correctId: 'B',
    wordFact: '"Necessary" is one of the most commonly misspelled words. Remember: one C, two S\'s — ne-CES-sa-ry.',
  },
  {
    number: 35,
    dimension: 'Word Form',
    difficulty: 'medium',
    accentColor: dimColors('wf', 'medium').accent,
    bgColor: dimColors('wf', 'medium').bg,
    letters: ['E', 'D', 'U', 'C', 'A', 'T', 'I', 'O', 'N', 'A', 'L'],
    targetWord: 'EDUCATIONAL',
    hint: 'Add -al to the noun \'education\' to get this adjective',
    mcqQuestion: 'The field trip to the science museum was very __________ because students saw real exhibits from their lessons.',
    choices: [
      { id: 'A', text: 'Education' },
      { id: 'B', text: 'Educational' },
      { id: 'C', text: 'Educate' },
      { id: 'D', text: 'Educationally' },
    ],
    correctId: 'B',
    wordFact: '"Educational" is the adjective form of \'education.\' Adding \'-al\' turns a noun into an adjective describing a quality.',
  },
  {
    number: 36,
    dimension: 'Word Form',
    difficulty: 'medium',
    accentColor: dimColors('wf', 'medium').accent,
    bgColor: dimColors('wf', 'medium').bg,
    letters: ['C', 'L', 'O', 'S', 'E', 'D'],
    targetWord: 'CLOSED',
    hint: 'Past participle of \'close\' — describes the current state of a door or shop',
    mcqQuestion: 'The students arrived at the library on Saturday but found that it was __________ for the day.',
    choices: [
      { id: 'A', text: 'Close' },
      { id: 'B', text: 'Closed' },
      { id: 'C', text: 'Closing' },
      { id: 'D', text: 'Closer' },
    ],
    correctId: 'B',
    wordFact: '"Closed" is the past participle of \'close,\' used as an adjective here. It describes a state — the library was already shut.',
  },
  {
    number: 37,
    dimension: 'Word Form',
    difficulty: 'medium',
    accentColor: dimColors('wf', 'medium').accent,
    bgColor: dimColors('wf', 'medium').bg,
    letters: ['C', 'L', 'E', 'A', 'R', 'L', 'Y'],
    targetWord: 'CLEARLY',
    hint: 'Add -ly to the adjective to describe how an action is performed',
    mcqQuestion: 'During the speech choir, the lead speaker projected her voice so __________ that everyone could hear.',
    choices: [
      { id: 'A', text: 'Clear' },
      { id: 'B', text: 'Clearly' },
      { id: 'C', text: 'Clearer' },
      { id: 'D', text: 'Clearness' },
    ],
    correctId: 'B',
    wordFact: '"Clearly" uses the suffix -ly to change the adjective \'clear\' into an adverb. Adverbs describe how an action is done.',
  },

  // ── Hard (38-40) ──────────────────────────────────────────────────────────
  {
    number: 38,
    dimension: 'Word Form',
    difficulty: 'hard',
    accentColor: dimColors('wf', 'hard').accent,
    bgColor: dimColors('wf', 'hard').bg,
    letters: ['S', 'A', 'T', 'I', 'S', 'F', 'I', 'E', 'D'],
    targetWord: 'SATISFIED',
    hint: 'Past participle of \'satisfy\' — describes how someone feels, not the action itself',
    mcqQuestion: 'The manager received the project report and was __________ with how efficiently the team completed all tasks.',
    choices: [
      { id: 'A', text: 'Satisfy' },
      { id: 'B', text: 'Satisfied' },
      { id: 'C', text: 'Satisfaction' },
      { id: 'D', text: 'Satisfying' },
    ],
    correctId: 'B',
    wordFact: '"Satisfied" is the past participle of \'satisfy,\' used to describe how a person feels — pleased with an outcome.',
  },
  {
    number: 39,
    dimension: 'Word Form',
    difficulty: 'hard',
    accentColor: dimColors('wf', 'hard').accent,
    bgColor: dimColors('wf', 'hard').bg,
    letters: ['U', 'N', 'D', 'E', 'R', 'S', 'T', 'A', 'N', 'D'],
    targetWord: 'UNDERSTAND',
    hint: 'After modal verbs like \'would\' or \'can\', always use the base verb form',
    mcqQuestion: 'Before the competition, the coach gathered the players to make sure everyone would __________ the official game mechanics.',
    choices: [
      { id: 'A', text: 'Understand' },
      { id: 'B', text: 'Understood' },
      { id: 'C', text: 'Understanding' },
      { id: 'D', text: 'Understanded' },
    ],
    correctId: 'A',
    wordFact: '"Understand" is an irregular verb — its past tense is \'understood,\' not \'understanded.\' After \'would,\' use the base form.',
  },
  {
    number: 40,
    dimension: 'Word Form',
    difficulty: 'hard',
    accentColor: dimColors('wf', 'hard').accent,
    bgColor: dimColors('wf', 'hard').bg,
    letters: ['F', 'R', 'I', 'G', 'H', 'T', 'E', 'N', 'E', 'D'],
    targetWord: 'FRIGHTENED',
    hint: 'Describes the person who feels the emotion, not the thing causing it',
    mcqQuestion: 'During the storm, a loud thunderclap shook the windows. The little girl was __________ by the sound?',
    choices: [
      { id: 'A', text: 'Frighten' },
      { id: 'B', text: 'Frightened' },
      { id: 'C', text: 'Frightening' },
      { id: 'D', text: 'Frighteness' },
    ],
    correctId: 'B',
    wordFact: '"Frightened" is the past participle describing a person\'s feeling. Compare with \'frightening,\' which describes the cause.',
  },
]

// ─── Auto-apply scrambled letters only (difficulty + colors stay as authored) ──
;(function applyScramble() {
  ALL_LEVELS.forEach(level => {
    level.letters = scramble(level.targetWord, level.number)
  })
})()

// ─── Filter by difficulty ─────────────────────────────────────────────────────
export function getLevelsByDifficulty(difficulty: Difficulty): Level[] {
  return ALL_LEVELS.filter(l => l.difficulty === difficulty)
}

// Legacy export for compatibility
export const LEVELS = ALL_LEVELS

// ─── Dev-time validation: every level must have a non-empty hint ─────────────
if (import.meta.env.DEV) {
  ALL_LEVELS.forEach(level => {
    if (!level.hint?.trim()) {
      console.warn(
        `[Dragscape] Level ${level.number} "${level.targetWord}" is missing a hint!`
      )
    }
  })
}

