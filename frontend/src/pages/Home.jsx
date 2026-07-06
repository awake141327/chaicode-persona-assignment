import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PERSONAS, personaGradient, personaInitials } from '../personas.js'
import { deletePersona, getCustomPersonas } from '../api/client.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

const cardClasses =
  'flex flex-col items-center gap-3 rounded-3xl border border-white/50 bg-white/50 p-8 text-center shadow-xl shadow-purple-500/10 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-accent/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-white/6 dark:shadow-black/30'

function Home() {
  const [customPersonas, setCustomPersonas] = useState([])

  useEffect(() => {
    getCustomPersonas()
      .then(setCustomPersonas)
      .catch(() => {}) // backend down — built-in cards still render
  }, [])

  async function handleDelete(personaId) {
    if (!window.confirm('Delete this persona? Its chats cannot be recovered.')) return
    try {
      await deletePersona(personaId)
      setCustomPersonas((prev) => prev.filter((p) => p.id !== personaId))
    } catch {
      // keep the card if the delete failed
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-8">
      <header className="flex items-center justify-between py-5">
        <span className="text-2xl font-bold tracking-tight">☕ ChaiCode</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 pb-16 sm:gap-14">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Persona{' '}
            <span className="bg-linear-to-r from-accent to-fuchsia-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mt-3 text-slate-600 sm:text-lg dark:text-slate-400">
            Pick a mentor and start the conversation — or build your own
          </p>
        </div>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((persona) => (
            <div key={persona.id} className={cardClasses}>
              <div className="rounded-full bg-linear-to-br from-accent via-fuchsia-500 to-cyan-400 p-1">
                <img
                  src={persona.image}
                  alt={persona.name}
                  className="size-28 rounded-full object-cover"
                />
              </div>
              <h2 className="mt-2 text-xl font-bold">{persona.name}</h2>
              <p className="min-h-10 text-sm text-slate-600 dark:text-slate-400">
                {persona.tagline}
              </p>
              <Link
                to={`/chat/${persona.id}`}
                className="mt-2 rounded-full bg-linear-to-r from-purple-600 to-fuchsia-700 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:brightness-110 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                Chat with {persona.name.split(' ')[0]}
              </Link>
            </div>
          ))}

          {customPersonas.map((persona) => (
            <div key={persona.id} className={`relative ${cardClasses}`}>
              <button
                type="button"
                onClick={() => handleDelete(persona.id)}
                aria-label={`Delete ${persona.name}`}
                title="Delete persona"
                className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-500 dark:text-slate-400"
              >
                ✕
              </button>
              <div className="rounded-full bg-linear-to-br from-accent via-fuchsia-500 to-cyan-400 p-1">
                <div
                  className={`flex size-28 items-center justify-center rounded-full bg-linear-to-br text-3xl font-bold text-white ${personaGradient(persona.id)}`}
                >
                  {personaInitials(persona.name)}
                </div>
              </div>
              <h2 className="mt-2 text-xl font-bold">{persona.name}</h2>
              <p className="line-clamp-2 min-h-10 text-sm text-slate-600 dark:text-slate-400">
                {persona.tagline}
              </p>
              <Link
                to={`/chat/${persona.id}`}
                className="mt-2 rounded-full bg-linear-to-r from-purple-600 to-fuchsia-700 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:brightness-110 motion-reduce:transition-none motion-reduce:hover:scale-100"
              >
                Chat with {persona.name.split(' ')[0]}
              </Link>
            </div>
          ))}

          <Link
            to="/create"
            className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-accent/40 bg-white/30 p-8 text-center backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-accent hover:bg-white/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-white/4 dark:hover:bg-white/8"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-purple-600 to-fuchsia-700 text-3xl text-white shadow-lg shadow-accent/30">
              +
            </span>
            <span className="text-lg font-bold">Create your own</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Answer a few questions and build a custom coding mentor
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default Home
