import type { LevelId } from './curriculum'

export type LevelProgress = {
  attempts: number
  correct: number
  streak: number
}

export type ProgressState = {
  stars: number
  completedToday: number
  levels: Partial<Record<LevelId, LevelProgress>>
  sessions: SessionRecord[]
}

export type SessionAnswer = {
  expression: string
  prompt: string
  selected: number
  answer: number
  correct: boolean
}

export type SessionRecord = {
  id: string
  date: string
  levelId: LevelId
  correct: number
  total: number
  answers: SessionAnswer[]
}

export type SettingsState = {
  hintsEnabled: boolean
  answerMode: 'choice' | 'type'
  voiceEnabled: boolean
}

const key = 'petualangan-angka-progress'

export const initialProgress: ProgressState = {
  stars: 0,
  completedToday: 0,
  levels: {},
  sessions: [],
}

export const initialSettings: SettingsState = {
  hintsEnabled: true,
  answerMode: 'choice',
  voiceEnabled: true,
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return initialProgress
    const parsed = JSON.parse(raw)
    return { ...initialProgress, ...parsed, sessions: parsed.sessions ?? [] }
  } catch {
    return initialProgress
  }
}

export function saveProgress(progress: ProgressState) {
  localStorage.setItem(key, JSON.stringify(progress))
}

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem('petualangan-angka-settings')
    if (!raw) return initialSettings
    return { ...initialSettings, ...JSON.parse(raw) }
  } catch {
    return initialSettings
  }
}

export function saveSettings(settings: SettingsState) {
  localStorage.setItem('petualangan-angka-settings', JSON.stringify(settings))
}

export function recordSession(
  progress: ProgressState,
  levelId: LevelId,
  correctCount: number,
  totalQuestions: number,
  answers: SessionAnswer[],
): ProgressState {
  const previous = progress.levels[levelId] ?? { attempts: 0, correct: 0, streak: 0 }
  const nextLevel = {
    attempts: previous.attempts + totalQuestions,
    correct: previous.correct + correctCount,
    streak: correctCount === totalQuestions ? previous.streak + 1 : 0,
  }
  return {
    stars: progress.stars + correctCount,
    completedToday: progress.completedToday + totalQuestions,
    sessions: [
      {
        id: `${Date.now()}-${levelId}`,
        date: new Date().toISOString(),
        levelId,
        correct: correctCount,
        total: totalQuestions,
        answers,
      },
      ...(progress.sessions ?? []),
    ].slice(0, 100),
    levels: {
      ...progress.levels,
      [levelId]: nextLevel,
    },
  }
}
