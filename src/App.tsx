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

const firstLevel = levels[0]
const sessionLength = 10

function App() {
  const [selectedId, setSelectedId] = useState<LevelId>(firstLevel.id)
  const [seed, setSeed] = useState(() => Date.now() % 100000)
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [settings, setSettings] = useState<SettingsState>(() => loadSettings())
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [session, setSession] = useState(() => createSession(firstLevel.id, Date.now() % 100000))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([])
  const [screen, setScreen] = useState<'practice' | 'result' | 'about' | 'settings'>('practice')
  const [sessionSaved, setSessionSaved] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [levelPickerOpen, setLevelPickerOpen] = useState(false)

  const selectedLevel = levels.find((level) => level.id === selectedId) ?? firstLevel
  const challenge = useMemo(() => session[questionIndex] ?? makeChallenge(selectedId, seed), [questionIndex, seed, selectedId, session])
  const levelProgress = progress.levels[selectedId]
  const accuracy = levelProgress?.attempts ? Math.round((levelProgress.correct / levelProgress.attempts) * 100) : 0
  const coachMessage = getCoachMessage(levelProgress?.attempts ?? 0, accuracy, levelProgress?.streak ?? 0)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  function chooseLevel(levelId: LevelId) {
    setSelectedId(levelId)
    startSession(levelId)
    setLevelPickerOpen(false)
  }

  function answer(option: number) {
    if (feedback !== 'idle') return
    const correct = option === challenge.answer
    setSelectedAnswer(option)
    setFeedback(correct ? 'correct' : 'wrong')
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
    if (questionIndex + 1 >= sessionLength) {
      saveSessionResult()
      setScreen('result')
      return
    }
    setQuestionIndex((value) => value + 1)
    setFeedback('idle')
    setSelectedAnswer(null)
    setHintOpen(false)
    setTypedAnswer('')
  }

  function startSession(levelId = selectedId) {
    const nextSeed = Date.now() % 100000
    setSeed(nextSeed)
    setSession(createSession(levelId, nextSeed))
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
      recordSession(current, selectedId, sessionAnswers.filter((answer) => answer.correct).length, sessionLength, sessionAnswers),
    )
    setSessionSaved(true)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Numera</p>
          <h1>Numerasi bertahap untuk anak usia dini</h1>
        </div>
        <div className="top-actions">
          <div className="score-strip" aria-label="Progress belajar">
            <span>{progress.stars} poin</span>
            <span>Soal {Math.min(questionIndex + 1, sessionLength)}/{sessionLength}</span>
            <span>{accuracy}% level ini</span>
          </div>
          <nav className="main-nav" aria-label="Navigasi utama">
            <button className={screen !== 'about' ? 'active' : ''} type="button" onClick={() => setScreen('practice')}>
              Latihan
            </button>
            <button className={screen === 'about' ? 'active' : ''} type="button" onClick={() => setScreen('about')}>
              About
            </button>
            <button className={screen === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}>
              Pengaturan
            </button>
          </nav>
        </div>
      </header>

      {screen === 'about' ? (
        <AboutPage selectedLevel={selectedLevel} levelProgress={levelProgress} coachMessage={coachMessage} />
      ) : screen === 'settings' ? (
        <SettingsPage progress={progress} setProgress={setProgress} settings={settings} setSettings={setSettings} />
      ) : screen === 'result' ? (
        <section className="result-panel" aria-label="Hasil latihan">
          <p className="eyebrow">Hasil Latihan</p>
          <h2>{selectedLevel.title}</h2>
          <strong>{sessionAnswers.filter((answer) => answer.correct).length}/{sessionLength} benar</strong>
          <p>{getResultMessage(sessionAnswers.filter((answer) => answer.correct).length)}</p>
          <button type="button" onClick={() => startSession()}>Ulangi paket 10 soal</button>
        </section>
      ) : (
        <>

      <section className="workspace" aria-label="Arena belajar">
        <section className="play-area">
          <section className="level-summary" style={{ '--level-color': selectedLevel.color } as CSSProperties}>
            <span className="level-index">{levels.findIndex((level) => level.id === selectedId) + 1}</span>
            <div>
              <p className="eyebrow">{selectedLevel.band} / {selectedLevel.strand}</p>
              <h2>{selectedLevel.title}</h2>
              <p>{selectedLevel.subtitle}</p>
            </div>
            <button type="button" onClick={() => setLevelPickerOpen(true)}>Ganti level</button>
          </section>

          <div className="lesson-band" style={{ '--level-color': selectedLevel.color } as CSSProperties}>
            <div>
              <p className="eyebrow">{selectedLevel.band} / {selectedLevel.strand}</p>
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
              <strong>{challenge.expression}</strong>
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
        </>
      )}

      {feedback !== 'idle' && (
        <FeedbackDialog
          correct={feedback === 'correct'}
          selectedAnswer={selectedAnswer}
          correctAnswer={challenge.answer}
          onNext={nextChallenge}
          isLast={questionIndex + 1 >= sessionLength}
        />
      )}

      {levelPickerOpen && (
        <div className="picker-backdrop" role="dialog" aria-modal="true" aria-label="Pilih level">
          <section className="level-picker">
            <div className="picker-header">
              <div>
                <p className="eyebrow">Pilih Level</p>
                <h2>Modul latihan</h2>
              </div>
              <button type="button" onClick={() => setLevelPickerOpen(false)}>Tutup</button>
            </div>
            <div className="level-list">
              {levels.map((level, index) => (
                <button
                  key={level.id}
                  className={level.id === selectedId ? 'level-node active' : 'level-node'}
                  onClick={() => chooseLevel(level.id)}
                  style={{ '--level-color': level.color } as CSSProperties}
                  type="button"
                >
                  <span className="level-index">{index + 1}</span>
                  <span>
                    <strong>{level.title}</strong>
                    <small>{level.band} - {level.strand}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
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

function AboutPage({
  selectedLevel,
  levelProgress,
  coachMessage,
}: {
  selectedLevel: Level
  levelProgress: { attempts: number; correct: number; streak: number } | undefined
  coachMessage: string
}) {
  return (
    <section className="about-page" aria-label="Kurikulum dan metode">
      <div className="about-hero">
        <p className="eyebrow">Metode Belajar</p>
        <h2>Merdeka-aligned Singapore Math</h2>
        <p>
          Aplikasi ini memakai Kurikulum Merdeka sebagai peta materi, lalu menggunakan pendekatan Singapore Math
          untuk membangun konsep melalui model konkret, gambar, dan simbol.
        </p>
      </div>
      <div className="curriculum-grid">
        {curriculumNotes.map((note) => (
          <article key={note.title}>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
          </article>
        ))}
      </div>
      <section className="teacher-panel" aria-label="Ringkasan level">
        <div>
          <p className="eyebrow">Catatan Level Aktif</p>
          <h2>{selectedLevel.goal}</h2>
          <p className="coach-message">{coachMessage}</p>
        </div>
        <dl>
          <div>
            <dt>Progress level</dt>
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
    </section>
  )
}

function SettingsPage({
  progress,
  setProgress,
  settings,
  setSettings,
}: {
  progress: ProgressState
  setProgress: (progress: ProgressState) => void
  settings: SettingsState
  setSettings: (settings: SettingsState) => void
}) {
  function exportData() {
    const blob = new Blob([JSON.stringify({ progress, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'petualangan-angka-data.json'
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
        <h2>Preferensi latihan dan data belajar</h2>
        <p>Atur cara menjawab, tampilan bantuan, dan simpan atau pindahkan riwayat belajar ke perangkat lain.</p>
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
          <h3>Riwayat sesi</h3>
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

      <div className="history-list">
        {progress.sessions.slice(0, 8).map((session) => (
          <article key={session.id}>
            <strong>{levels.find((level) => level.id === session.levelId)?.title ?? session.levelId}</strong>
            <span>{new Date(session.date).toLocaleString('id-ID')}</span>
            <b>{session.correct}/{session.total}</b>
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

export default App

function createSession(levelId: LevelId, seed: number) {
  return Array.from({ length: sessionLength }, (_, index) => makeChallenge(levelId, mixSeed(seed, index)))
}

function mixSeed(seed: number, index: number) {
  let value = Math.imul(seed + 0x9e3779b9, 0x85ebca6b)
  value ^= Math.imul(index + 1, 0xc2b2ae35)
  value ^= value >>> 16
  value = Math.imul(value, 0x27d4eb2d)
  value ^= value >>> 15
  return (value >>> 0) % 2147483646 + 1
}

function getResultMessage(correct: number) {
  if (correct >= 9) return 'Penguasaan sangat baik. Anak siap naik ke variasi soal berikutnya.'
  if (correct >= 7) return 'Sudah kuat. Ulangi sekali lagi untuk membuat strategi lebih otomatis.'
  if (correct >= 5) return 'Cukup baik. Perlu penguatan visual sebelum latihan simbol.'
  return 'Kembali ke tahap konkret. Gunakan benda atau model gambar lebih dulu.'
}
