import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import './App.css'
import { curriculumNotes, levels, type Level, type LevelId } from './curriculum'
import { makeChallenge, type Challenge } from './generators'
import {
  loadProgress,
  loadSettings,
  recordSession,
  saveProgress,
  saveSettings,
  type ProgressState,
  type SessionAnswer,
  type SettingsState,
} from './storage'

type AppScreen = 'home' | 'intro' | 'practice' | 'result' | 'dashboard' | 'settings'
type LearningBand = Level['band']

const firstLevel = levels[0]
const defaultSessionLength = 10
const classOneLevelIds: LevelId[] = ['add-10', 'subtract-10', 'bonds-10', 'add-20']

function App() {
  const [selectedId, setSelectedId] = useState<LevelId>(firstLevel.id)
  const [selectedBand, setSelectedBand] = useState<LearningBand | null>(null)
  const [questionCount, setQuestionCount] = useState(defaultSessionLength)
  const [seed, setSeed] = useState(() => Date.now() % 100000)
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [session, setSession] = useState(() => createSession(firstLevel.id, Date.now() % 100000, defaultSessionLength))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([])
  const [screen, setScreen] = useState<AppScreen>('home')
  const [sessionSaved, setSessionSaved] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')

  const selectedLevel = levels.find((level) => level.id === selectedId) ?? firstLevel
  const challenge = useMemo(() => session[questionIndex] ?? makeChallenge(selectedId, seed), [questionIndex, seed, selectedId, session])
  const levelProgress = progress.levels[selectedId]
  const accuracy = levelProgress?.attempts ? Math.round((levelProgress.correct / levelProgress.attempts) * 100) : 0
  const coachMessage = getCoachMessage(levelProgress?.attempts ?? 0, accuracy, levelProgress?.streak ?? 0)
  const currentTotal = session.length || questionCount

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (screen !== 'practice' || feedback !== 'idle' || !settings.voiceEnabled) return
    speak(`${challenge.prompt}. ${challenge.expression}`)
  }, [challenge.expression, challenge.prompt, feedback, screen, settings.voiceEnabled])

  function openLearning() {
    setScreen('home')
  }

  function chooseBand(band: LearningBand) {
    setSelectedBand(band)
    setScreen('home')
  }

  function openLevelIntro(levelId: LevelId) {
    setSelectedId(levelId)
    setScreen('intro')
    setFeedback('idle')
    setSelectedAnswer(null)
    setHintOpen(false)
    setTypedAnswer('')
  }

  function answer(option: number) {
    if (feedback !== 'idle') return
    const correct = option === challenge.answer
    setSelectedAnswer(option)
    setFeedback(correct ? 'correct' : 'wrong')
    if (settings.voiceEnabled) speak(correct ? 'Benar.' : `Belum tepat. Jawaban yang benar ${challenge.answer}.`)
    setSessionAnswers((current) => [
      ...current,
      {
        expression: challenge.expression,
        prompt: challenge.prompt,
        selected: option,
        answer: challenge.answer,
        correct,
      },
    ])
  }

  function submitTypedAnswer() {
    const value = Number(typedAnswer)
    if (!Number.isFinite(value)) return
    answer(value)
  }

  function nextChallenge() {
    if (questionIndex + 1 >= currentTotal) {
      saveSessionResult()
      setFeedback('idle')
      setSelectedAnswer(null)
      setHintOpen(false)
      setTypedAnswer('')
      setScreen('result')
      return
    }
    setQuestionIndex((value) => value + 1)
    setFeedback('idle')
    setSelectedAnswer(null)
    setHintOpen(false)
    setTypedAnswer('')
  }

  function startSession(levelId = selectedId, total = questionCount) {
    const nextSeed = Date.now() % 100000
    setSeed(nextSeed)
    setSession(createSession(levelId, nextSeed, total))
    setQuestionIndex(0)
    setSessionAnswers([])
    setFeedback('idle')
    setSelectedAnswer(null)
    setHintOpen(false)
    setTypedAnswer('')
    setScreen('practice')
    setSessionSaved(false)
  }

  function resetCurrentSession() {
    setQuestionIndex(0)
    setSessionAnswers([])
    setFeedback('idle')
    setSelectedAnswer(null)
    setHintOpen(false)
    setTypedAnswer('')
    setScreen('practice')
    setSessionSaved(false)
  }

  function saveSessionResult() {
    if (sessionSaved) return
    setProgress((current) =>
      recordSession(current, selectedId, sessionAnswers.filter((answer) => answer.correct).length, currentTotal, sessionAnswers),
    )
    setSessionSaved(true)
  }

  const learningActive = screen === 'home' || screen === 'intro' || screen === 'practice' || screen === 'result'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Numera</h1>
          <p className="hero-subtitle">Latihan numerasi berbasis Singapore Math untuk anak TK B sampai kelas 2.</p>
        </div>
        <div className="top-actions">
          <PrimaryNav active={screen} learningActive={learningActive} setScreen={setScreen} openLearning={openLearning} />
        </div>
      </header>

      {screen === 'dashboard' ? (
        <DashboardPage progress={progress} />
      ) : screen === 'settings' ? (
        <SettingsPage
          coachMessage={coachMessage}
          levelProgress={levelProgress}
          progress={progress}
          selectedLevel={selectedLevel}
          setProgress={setProgress}
          settings={settings}
          setSettings={setSettings}
        />
      ) : screen === 'result' ? (
        <ResultPage
          correct={sessionAnswers.filter((answer) => answer.correct).length}
          level={selectedLevel}
          onBackToModules={() => setScreen('home')}
          onRepeat={() => startSession(selectedId, currentTotal)}
          total={currentTotal}
        />
      ) : screen === 'intro' ? (
        <IntroPage
          level={selectedLevel}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          startSession={() => startSession(selectedId, questionCount)}
        />
      ) : screen === 'practice' ? (
        <PracticePage
          answer={answer}
          challenge={challenge}
          feedback={feedback}
          hintOpen={hintOpen}
          questionIndex={questionIndex}
          resetCurrentSession={resetCurrentSession}
          selectedAnswer={selectedAnswer}
          selectedLevel={selectedLevel}
          setHintOpen={setHintOpen}
          settings={settings}
          submitTypedAnswer={submitTypedAnswer}
          total={currentTotal}
          typedAnswer={typedAnswer}
          setTypedAnswer={setTypedAnswer}
        />
      ) : (
        <LearningHome
          chooseBand={chooseBand}
          openLevelIntro={openLevelIntro}
          progress={progress}
          selectedBand={selectedBand}
          setSelectedBand={setSelectedBand}
        />
      )}

      {feedback !== 'idle' && (
        <FeedbackDialog
          correct={feedback === 'correct'}
          selectedAnswer={selectedAnswer}
          correctAnswer={challenge.answer}
          onNext={nextChallenge}
          isLast={questionIndex + 1 >= currentTotal}
        />
      )}

      <PrimaryNav
        active={screen}
        className="bottom-nav"
        learningActive={learningActive}
        setScreen={setScreen}
        openLearning={openLearning}
      />
    </main>
  )
}

function PrimaryNav({
  active,
  className = 'main-nav',
  learningActive,
  openLearning,
  setScreen,
}: {
  active: AppScreen
  className?: string
  learningActive: boolean
  openLearning: () => void
  setScreen: (screen: AppScreen) => void
}) {
  return (
    <nav className={className} aria-label="Navigasi utama">
      <button className={learningActive ? 'active' : ''} type="button" onClick={openLearning}>
        <span>Latihan</span>
      </button>
      <button className={active === 'dashboard' ? 'active' : ''} type="button" onClick={() => setScreen('dashboard')}>
        <span>Dashboard</span>
      </button>
      <button className={active === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}>
        <span>Setting</span>
      </button>
    </nav>
  )
}

function LearningHome({
  chooseBand,
  openLevelIntro,
  progress,
  selectedBand,
  setSelectedBand,
}: {
  chooseBand: (band: LearningBand) => void
  openLevelIntro: (levelId: LevelId) => void
  progress: ProgressState
  selectedBand: LearningBand | null
  setSelectedBand: (band: LearningBand | null) => void
}) {
  const bands: { band: LearningBand; title: string; body: string }[] = [
    { band: 'TK B', title: 'TK B', body: 'Fondasi bilangan, jumlah benda, dan perbandingan awal.' },
    { band: 'Kelas 1', title: 'Kelas 1', body: 'Operasi dasar, number bonds, dan strategi make ten.' },
    { band: 'Kelas 2', title: 'Kelas 2', body: 'Nilai tempat, operasi dua digit, perkalian dan pembagian awal.' },
  ]

  const visibleLevels = getLevelsForBand(selectedBand)

  if (selectedBand) {
    return (
      <section className="learning-home module-page" aria-label={`Latihan ${selectedBand}`}>
        <div className="module-heading">
          <div>
            <p className="eyebrow">Latihan</p>
            <h2>{selectedBand}</h2>
          </div>
          <button type="button" onClick={() => setSelectedBand(null)}>Pilih jenjang lain</button>
        </div>
        <div className="module-grid">
          {visibleLevels.map((level) => {
            const levelIndex = levels.findIndex((item) => item.id === level.id) + 1
            const levelProgress = progress.levels[level.id]
            const accuracy = levelProgress?.attempts ? Math.round((levelProgress.correct / levelProgress.attempts) * 100) : null
            return (
              <button
                key={level.id}
                className="module-card"
                style={{ '--level-color': level.color } as CSSProperties}
                type="button"
                onClick={() => openLevelIntro(level.id)}
              >
                <span className="level-index">{levelIndex}</span>
                <strong>{level.title}</strong>
                <small>{level.subtitle}</small>
                {accuracy !== null && <b>{accuracy}% akurasi</b>}
              </button>
            )
          })}
          {selectedBand === 'Kelas 1' && (
            <article className="module-card exam-card" aria-label="Mode ujian belum tersedia">
              <span className="level-index">U</span>
              <strong>Mode Ujian</strong>
              <small>Campuran semua latihan Kelas 1.</small>
              <b>Segera dibuat</b>
            </article>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="learning-home" aria-label="Pilih latihan">
      <div className="section-heading">
        <p className="eyebrow">Latihan</p>
        <h2>Pilih jenjang belajar</h2>
      </div>
      <div className="grade-grid">
        {bands.map((item) => (
          <button
            key={item.band}
            className={selectedBand === item.band ? 'grade-card active' : 'grade-card'}
            type="button"
            onClick={() => chooseBand(item.band)}
          >
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function IntroPage({
  level,
  questionCount,
  setQuestionCount,
  startSession,
}: {
  level: Level
  questionCount: number
  setQuestionCount: (count: number) => void
  startSession: () => void
}) {
  const tips = getLevelTips(level.id)
  return (
    <section className="intro-page" aria-label="Persiapan latihan">
      <article className="intro-card" style={{ '--level-color': level.color } as CSSProperties}>
        <p className="eyebrow">{level.band} / {level.strand}</p>
        <h2>{level.title}</h2>
        <p>{level.goal}</p>
        <div className="method-grid">
          <div>
            <strong>Fokus konsep</strong>
            <span>{level.merdeka}</span>
          </div>
          <div>
            <strong>Singapore Math</strong>
            <span>{level.singapore}</span>
          </div>
        </div>
        <div className="tips-box">
          <strong>Tips mengerjakan</strong>
          <ul>
            {tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
        <div className="start-row">
          <label>
            Jumlah soal
            <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
              <option value={10}>10 soal</option>
              <option value={15}>15 soal</option>
              <option value={20}>20 soal</option>
            </select>
          </label>
          <button type="button" onClick={startSession}>Mulai</button>
        </div>
      </article>
    </section>
  )
}

function PracticePage({
  answer,
  challenge,
  feedback,
  hintOpen,
  questionIndex,
  resetCurrentSession,
  selectedAnswer,
  selectedLevel,
  setHintOpen,
  settings,
  submitTypedAnswer,
  total,
  typedAnswer,
  setTypedAnswer,
}: {
  answer: (option: number) => void
  challenge: Challenge
  feedback: 'idle' | 'correct' | 'wrong'
  hintOpen: boolean
  questionIndex: number
  resetCurrentSession: () => void
  selectedAnswer: number | null
  selectedLevel: Level
  setHintOpen: (value: boolean | ((value: boolean) => boolean)) => void
  settings: SettingsState
  submitTypedAnswer: () => void
  total: number
  typedAnswer: string
  setTypedAnswer: (value: string) => void
}) {
  return (
    <section className="workspace" aria-label="Arena belajar">
      <section className="play-area">
        <div className="lesson-band" style={{ '--level-color': selectedLevel.color } as CSSProperties}>
          <div>
            <p className="eyebrow">Soal {questionIndex + 1}/{total}</p>
            <h2>{selectedLevel.title}</h2>
            <p>{selectedLevel.subtitle}</p>
          </div>
          <div className="lesson-actions">
            <span className="lesson-badge">{challenge.strategy}</span>
            <button type="button" onClick={resetCurrentSession}>Reset sesi</button>
          </div>
        </div>

        <div className="challenge-board">
          <div className="story-panel">
            <p>{challenge.story}</p>
            <h3>{challenge.prompt}</h3>
            {hintOpen && <strong>{challenge.expression}</strong>}
          </div>

          <VisualModel challenge={challenge} showHint={hintOpen} />

          {settings.answerMode === 'choice' ? (
            <div className="answer-grid" aria-label="Pilihan jawaban">
              {challenge.options.map((option) => (
                <button
                  key={option}
                  className={getAnswerClass(option, selectedAnswer, challenge.answer, feedback)}
                  disabled={feedback !== 'idle'}
                  type="button"
                  onClick={() => answer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="typed-answer">
              <input
                aria-label="Jawaban"
                disabled={feedback !== 'idle'}
                inputMode="numeric"
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitTypedAnswer()
                }}
              />
              <button disabled={feedback !== 'idle' || typedAnswer.trim() === ''} type="button" onClick={submitTypedAnswer}>
                Cek jawaban
              </button>
            </div>
          )}

          <div className="hint-row">
            {settings.hintsEnabled && (
              <button type="button" onClick={() => setHintOpen((value) => !value)}>
                {hintOpen ? 'Sembunyikan hint' : 'Hint'}
              </button>
            )}
            {hintOpen && <span>{challenge.hint}</span>}
          </div>
        </div>
      </section>
    </section>
  )
}

function ResultPage({
  correct,
  level,
  onBackToModules,
  onRepeat,
  total,
}: {
  correct: number
  level: Level
  onBackToModules: () => void
  onRepeat: () => void
  total: number
}) {
  return (
    <section className="result-panel" aria-label="Hasil latihan">
      <p className="eyebrow">Hasil Latihan</p>
      <h2>{level.title}</h2>
      <strong>{correct}/{total} benar</strong>
      <p>{getResultMessage(correct, total)}</p>
      <div className="result-actions">
        <button type="button" onClick={onRepeat}>Ulangi paket soal</button>
        <button type="button" onClick={onBackToModules}>Pilih latihan lain</button>
      </div>
    </section>
  )
}

function DashboardPage({ progress }: { progress: ProgressState }) {
  const totalSessions = progress.sessions.length
  const totalCorrect = progress.sessions.reduce((sum, session) => sum + session.correct, 0)
  const totalQuestions = progress.sessions.reduce((sum, session) => sum + session.total, 0)
  const average = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  return (
    <section className="dashboard-page" aria-label="Dashboard belajar">
      <div className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h2>Laporan belajar</h2>
        <p>Mockup awal untuk ringkasan sesi, akurasi, dan materi yang perlu diulang.</p>
      </div>
      <div className="dashboard-grid">
        <article>
          <span>Total sesi</span>
          <strong>{totalSessions}</strong>
        </article>
        <article>
          <span>Rata-rata benar</span>
          <strong>{average}%</strong>
        </article>
        <article>
          <span>Poin terkumpul</span>
          <strong>{progress.stars}</strong>
        </article>
      </div>
      <div className="history-list">
        {progress.sessions.slice(0, 8).map((session) => (
          <article key={session.id}>
            <strong>{levels.find((level) => level.id === session.levelId)?.title ?? session.levelId}</strong>
            <span>{new Date(session.date).toLocaleString('id-ID')}</span>
            <b>{session.correct}/{session.total}</b>
          </article>
        ))}
        {progress.sessions.length === 0 && <p className="empty-state">Belum ada sesi tersimpan. Mulai latihan untuk mengisi dashboard.</p>}
      </div>
    </section>
  )
}

function SettingsPage({
  coachMessage,
  levelProgress,
  progress,
  selectedLevel,
  setProgress,
  settings,
  setSettings,
}: {
  coachMessage: string
  levelProgress: { attempts: number; correct: number; streak: number } | undefined
  progress: ProgressState
  selectedLevel: Level
  setProgress: (progress: ProgressState) => void
  settings: SettingsState
  setSettings: (settings: SettingsState) => void
}) {
  function exportData() {
    const blob = new Blob([JSON.stringify({ progress, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'numera-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function importData(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (data.progress) setProgress(data.progress)
        if (data.settings) setSettings({ ...settings, ...data.settings })
      } catch {
        // Invalid files are ignored to keep the local data safe.
      }
    }
    reader.readAsText(file)
  }

  return (
    <section className="settings-page" aria-label="Pengaturan">
      <div className="about-hero">
        <p className="eyebrow">Pengaturan</p>
        <h2>Preferensi dan metode belajar</h2>
        <p>Atur cara menjawab, bantuan soal, suara, serta simpan atau pindahkan riwayat belajar ke perangkat lain.</p>
      </div>

      <div className="settings-grid">
        <article>
          <h3>Bantuan soal</h3>
          <label className="setting-row">
            <input
              checked={settings.hintsEnabled}
              type="checkbox"
              onChange={(event) => setSettings({ ...settings, hintsEnabled: event.target.checked })}
            />
            <span>Tampilkan tombol Hint</span>
          </label>
        </article>

        <article>
          <h3>Suara</h3>
          <label className="setting-row">
            <input
              checked={settings.voiceEnabled}
              type="checkbox"
              onChange={(event) => setSettings({ ...settings, voiceEnabled: event.target.checked })}
            />
            <span>Bacakan soal dan hasil jawaban</span>
          </label>
        </article>

        <article>
          <h3>Mode jawaban</h3>
          <div className="segmented-control">
            <button
              className={settings.answerMode === 'choice' ? 'active' : ''}
              type="button"
              onClick={() => setSettings({ ...settings, answerMode: 'choice' })}
            >
              Pilihan ganda
            </button>
            <button
              className={settings.answerMode === 'type' ? 'active' : ''}
              type="button"
              onClick={() => setSettings({ ...settings, answerMode: 'type' })}
            >
              Ketik jawaban
            </button>
          </div>
        </article>

        <article>
          <h3>Data belajar</h3>
          <p>{progress.sessions.length} sesi tersimpan.</p>
          <div className="data-actions">
            <button type="button" onClick={exportData}>Export data</button>
            <label>
              Import data
              <input accept="application/json" type="file" onChange={(event) => importData(event.target.files?.[0])} />
            </label>
          </div>
        </article>
      </div>

      <section className="teacher-panel" aria-label="Kurikulum dan metode">
        <div>
          <p className="eyebrow">Metode</p>
          <h2>Merdeka-aligned Singapore Math</h2>
          <p className="coach-message">{coachMessage}</p>
        </div>
        <dl>
          <div>
            <dt>Progress level aktif</dt>
            <dd>
              {levelProgress?.attempts ?? 0} percobaan, {levelProgress?.correct ?? 0} benar,
              streak {levelProgress?.streak ?? 0}
            </dd>
          </div>
          <div>
            <dt>Kurikulum Merdeka</dt>
            <dd>{selectedLevel.merdeka}</dd>
          </div>
          <div>
            <dt>Singapore Math</dt>
            <dd>{selectedLevel.singapore}</dd>
          </div>
        </dl>
      </section>

      <div className="curriculum-grid">
        {curriculumNotes.map((note) => (
          <article key={note.title}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function FeedbackDialog({
  correct,
  selectedAnswer,
  correctAnswer,
  onNext,
  isLast,
}: {
  correct: boolean
  selectedAnswer: number | null
  correctAnswer: number
  onNext: () => void
  isLast: boolean
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Hasil jawaban">
      <div className={correct ? 'feedback-dialog correct' : 'feedback-dialog wrong'}>
        <p className="eyebrow">{correct ? 'Jawaban benar' : 'Coba lagi di soal berikutnya'}</p>
        <h2>{correct ? 'Benar' : 'Belum tepat'}</h2>
        <p>
          {correct
            ? 'Strategi yang dipakai sudah sesuai.'
            : `Jawabanmu ${selectedAnswer ?? '-'}, jawaban yang benar ${correctAnswer}.`}
        </p>
        <button type="button" onClick={onNext}>{isLast ? 'Lihat hasil' : 'Lanjut'}</button>
      </div>
    </div>
  )
}

function VisualModel({ challenge, showHint }: { challenge: Challenge; showHint: boolean }) {
  const visual = challenge.visual

  if (challenge.model === 'pattern') {
    return (
      <div className="visual-model pattern-model" aria-label="Model pola bilangan">
        {visual.map((value, index) => (
          <div key={`${value}-${index}`} className="pattern-step">
            <div className={index === challenge.missingIndex ? 'number-card missing' : 'number-card'}>
              {index === challenge.missingIndex ? '?' : value}
            </div>
            {index < visual.length - 1 && <span className={showHint ? 'pattern-arrow show' : 'pattern-arrow'}>+{challenge.step}</span>}
          </div>
        ))}
      </div>
    )
  }

  if (challenge.model === 'comparison') {
    return (
      <div className="visual-model comparison-model" aria-label="Model perbandingan bilangan">
        {visual.map((value) => (
          <div key={value} className="comparison-card">
            <span>{value}</span>
            <div className="mini-number-line">
              <i style={{ width: `${Math.min(100, (value / 20) * 100)}%` }}></i>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (challenge.model === 'number-bond') {
    const total = visual[0] + visual[1]
    return (
      <div className="visual-model bond-model" aria-label="Model number bond">
        <div className="bond-whole">{total}</div>
        <div className="bond-parts">
          <span>{visual[0]}</span>
          <span>?</span>
        </div>
      </div>
    )
  }

  if (challenge.model === 'place-value') {
    const tens = Math.floor(visual[0] / 10)
    const ones = visual[1]
    return (
      <div className="visual-model place-value" aria-label="Model puluhan satuan">
        <div className="place-column">
          <strong>Puluhan</strong>
          <div className="tens-blocks">
            {Array.from({ length: tens }, (_, index) => <span key={index}></span>)}
          </div>
        </div>
        <div className="place-column">
          <strong>Satuan</strong>
          <div className="ones-blocks">
            {Array.from({ length: ones }, (_, index) => <i key={index}></i>)}
          </div>
        </div>
      </div>
    )
  }

  if (challenge.model === 'groups') {
    return (
      <div className="visual-model grouped" aria-label="Model kelompok sama banyak">
        {visual.map((count, groupIndex) => (
          <div key={groupIndex} className="mini-group">
            <small>Kelompok {groupIndex + 1}</small>
            {Array.from({ length: count }, (_, index) => <ObjectToken key={index} item={challenge.item} />)}
          </div>
        ))}
      </div>
    )
  }

  if (challenge.model === 'sharing') {
    const people = visual[1]
    return (
      <div className="visual-model sharing-model" aria-label="Model berbagi rata">
        {Array.from({ length: people }, (_, personIndex) => (
          <div key={personIndex} className="share-plate">
            <small>Anak {personIndex + 1}</small>
            {Array.from({ length: challenge.answer }, (_, itemIndex) => (
              <ObjectToken key={itemIndex} item={challenge.item} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="visual-model" aria-label="Model benda">
      {visual.map((count, groupIndex) => (
        <div key={`${count}-${groupIndex}`} className={count < 0 ? 'object-group muted' : 'object-group'}>
          {Array.from({ length: Math.abs(count) }, (_, index) => (
            <ObjectToken key={index} item={challenge.item} muted={count < 0} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ObjectToken({ item = 'koin', muted = false }: { item?: string; muted?: boolean }) {
  return <span className={`object-token item-${item} ${muted ? 'muted-token' : ''}`} aria-label={item}></span>
}

function getLevelsForBand(band: LearningBand | null) {
  if (!band) return []
  if (band === 'Kelas 1') return levels.filter((level) => classOneLevelIds.includes(level.id))
  return levels.filter((level) => level.band === band)
}

function getAnswerClass(
  option: number,
  selectedAnswer: number | null,
  answer: number,
  feedback: 'idle' | 'correct' | 'wrong',
) {
  if (feedback === 'idle') return ''
  if (option === answer) return 'correct-answer'
  if (option === selectedAnswer) return 'wrong-answer'
  return 'dimmed-answer'
}

function getCoachMessage(attempts: number, accuracy: number, streak: number) {
  if (attempts === 0) return 'Mulai dengan mode santai. Fokuskan anak pada strategi, bukan kecepatan.'
  if (streak >= 3) return 'Streak sudah bagus. Anak siap diberi soal baru dengan angka sedikit lebih besar.'
  if (accuracy >= 80) return 'Konsep mulai kuat. Lanjutkan variasi cerita agar anak tidak hanya menghafal pola soal.'
  if (accuracy >= 50) return 'Masih perlu penguatan. Tampilkan benda atau garis bilangan sebelum simbol angka.'
  return 'Turunkan tekanan. Ulangi tahap concrete: hitung benda, kelompokkan, lalu baru jawab.'
}

function getLevelTips(levelId: LevelId) {
  const tips: Record<LevelId, string[]> = {
    'count-10': ['Sentuh satu benda untuk satu bilangan.', 'Cocokkan jumlah akhir dengan pilihan jawaban.'],
    'compare-20': ['Cari angka yang posisinya lebih jauh di garis bilangan.', 'Bandingkan dua angka dulu sebelum memilih.'],
    'add-10': ['Gabungkan dua kelompok benda.', 'Hitung dari kelompok yang lebih besar agar lebih cepat.'],
    'subtract-10': ['Mulai dari jumlah awal, lalu coret atau mundur sebanyak yang diambil.', 'Baca ulang pertanyaan: yang dicari adalah sisa.'],
    'bonds-10': ['Bayangkan 10 sebagai satu kelompok penuh.', 'Cari pasangan yang melengkapi angka pertama menjadi 10.'],
    'add-20': ['Pecah angka untuk membuat 10 lebih dulu.', 'Setelah sampai 10, tambahkan sisa angkanya.'],
    'subtract-20': ['Mundur ke 10 dulu jika angkanya dekat.', 'Gunakan garis bilangan untuk melihat lompatan mundur.'],
    'place-value': ['Pisahkan puluhan dan satuan.', 'Baca angka dua digit sebagai beberapa puluhan dan beberapa satuan.'],
    'add-100': ['Tambah puluhan dengan puluhan, satuan dengan satuan.', 'Susun jawaban dari nilai tempatnya.'],
    'multiply-groups': ['Hitung jumlah kelompok dan isi setiap kelompok.', 'Perkalian adalah penjumlahan kelompok sama banyak.'],
    'divide-share': ['Bagikan benda satu per satu sampai semua kelompok sama.', 'Jawaban adalah isi tiap kelompok.'],
    'pattern-logic': ['Lihat selisih antar angka.', 'Gunakan pola yang sama untuk menemukan angka hilang.'],
  }
  return tips[levelId]
}

function createSession(levelId: LevelId, seed: number, total: number) {
  return Array.from({ length: total }, (_, index) => makeChallenge(levelId, mixSeed(seed, index)))
}

function mixSeed(seed: number, index: number) {
  let value = Math.imul(seed + 0x9e3779b9, 0x85ebca6b)
  value ^= Math.imul(index + 1, 0xc2b2ae35)
  value ^= value >>> 16
  value = Math.imul(value, 0x27d4eb2d)
  value ^= value >>> 15
  return (value >>> 0) % 2147483646 + 1
}

function getResultMessage(correct: number, total: number) {
  const ratio = correct / total
  if (ratio >= 0.9) return 'Penguasaan sangat baik. Anak siap naik ke variasi soal berikutnya.'
  if (ratio >= 0.7) return 'Sudah kuat. Ulangi sekali lagi untuk membuat strategi lebih otomatis.'
  if (ratio >= 0.5) return 'Cukup baik. Perlu penguatan visual sebelum latihan simbol.'
  return 'Kembali ke tahap konkret. Gunakan benda atau model gambar lebih dulu.'
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'id-ID'
  utterance.rate = 0.92
  window.speechSynthesis.speak(utterance)
}

export default App
