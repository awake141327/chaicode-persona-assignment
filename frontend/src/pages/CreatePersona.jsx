import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPersona, getQuestions } from '../api/client.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const CORE_COUNT = 5
const MAX_EXTRA_WORDS = 100

const inputClasses =
  'w-full rounded-xl border border-white/50 bg-white/60 px-4 py-2.5 text-[15px] backdrop-blur-xl outline-none placeholder:text-slate-400 focus:border-accent dark:border-white/10 dark:bg-white/8 dark:placeholder:text-slate-500'

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function CreatePersona() {
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [counts, setCounts] = useState([5, 10, 20])
  const [loadError, setLoadError] = useState(false)

  const [name, setName] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [answers, setAnswers] = useState({})
  const [extraNotes, setExtraNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getQuestions()
      .then((data) => {
        setQuestions(data.questions)
        setCounts(data.counts)
      })
      .catch(() => setLoadError(true))
  }, [])

  const visibleQuestions = useMemo(
    () => questions.slice(0, questionCount),
    [questions, questionCount]
  )

  const extraWordCount = countWords(extraNotes)
  const extraTooLong = extraWordCount > MAX_EXTRA_WORDS

  const coreAnswered = questions
    .slice(0, CORE_COUNT)
    .every((question) => answers[question.id]?.trim())

  const canSubmit =
    name.trim().length >= 2 && coreAnswered && !extraTooLong && !submitting

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      // Only submit answers for the currently-visible questions — answers to
      // higher tiers stay in state (so they reappear if the count goes back
      // up) but must not silently shape a persona the user downsized.
      const submittedAnswers = Object.fromEntries(
        visibleQuestions
          .map((question) => [question.id, answers[question.id]])
          .filter(([, value]) => value?.trim())
      )
      const persona = await createPersona({
        name: name.trim(),
        questionCount,
        answers: submittedAnswers,
        extraNotes,
      })
      navigate(`/chat/${persona.id}`)
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not create the persona. Is the backend running?'
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="Back to personas"
            className="rounded-full px-2 py-1 text-xl transition-colors hover:bg-white/60 dark:hover:bg-white/10"
          >
            ←
          </Link>
          <span className="text-lg font-bold tracking-tight">Create your persona</span>
        </div>
        <ThemeToggle />
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-white/50 bg-white/50 p-6 text-center backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
          Could not load the builder questions. Is the backend running on port 8000?
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="rounded-3xl border border-white/50 bg-white/50 p-6 shadow-xl shadow-purple-500/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/6 dark:shadow-black/30">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="persona-name">
              Persona name
            </label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Captain Debug, Prof. Pixel, Rusty Rick..."
              maxLength={40}
              className={inputClasses}
            />

            <p className="mt-5 mb-1.5 text-sm font-semibold">How detailed should the persona be?</p>
            <div className="flex gap-2">
              {counts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    questionCount === count
                      ? 'border-accent bg-accent/10 text-purple-700 dark:text-white dark:bg-accent/25'
                      : 'border-white/50 bg-white/40 text-slate-600 hover:border-accent/40 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                  }`}
                >
                  {count} questions
                  <span className="mt-0.5 block text-xs font-normal opacity-70">
                    {count === 5 ? 'Quick sketch' : count === 10 ? 'Well-rounded' : 'Full character'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            {visibleQuestions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-white/50 bg-white/50 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/6"
              >
                <label
                  className="mb-1.5 block text-sm font-semibold"
                  htmlFor={`q-${question.id}`}
                >
                  {index + 1}. {question.label}
                  {index >= CORE_COUNT && (
                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                      optional
                    </span>
                  )}
                </label>
                <input
                  id={`q-${question.id}`}
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  maxLength={300}
                  className={inputClasses}
                />
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-white/50 bg-white/50 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/6">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="extra-notes">
              Anything else you want to add?
              <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                optional
              </span>
            </label>
            <textarea
              id="extra-notes"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Any extra quirks, favorite sayings, or details about how they should behave..."
              rows={4}
              className={`${inputClasses} resize-none`}
            />
            <p
              className={`mt-1.5 text-right text-xs ${
                extraTooLong ? 'font-semibold text-rose-500' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {extraWordCount}/{MAX_EXTRA_WORDS} words
              {extraTooLong && ' — please shorten it'}
            </p>
          </section>

          {error && (
            <p className="rounded-xl border border-rose-300/50 bg-rose-50/70 px-4 py-3 text-sm text-rose-600 backdrop-blur-xl dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="cursor-pointer rounded-full bg-linear-to-r from-purple-600 to-fuchsia-700 px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating persona...' : 'Create persona & start chatting'}
          </button>

          {!coreAnswered && (
            <p className="-mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              Fill in the persona name and the first {CORE_COUNT} questions to continue.
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export default CreatePersona
