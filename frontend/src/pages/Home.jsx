import { Link } from 'react-router-dom'
import { PERSONAS } from '../personas.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-8">
      <header className="flex items-center justify-between py-5">
        <span className="text-lg font-bold tracking-tight">☕ ChaiCode</span>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-10 pb-16 sm:gap-14">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Persona{' '}
            <span className="bg-linear-to-r from-accent to-fuchsia-500 bg-clip-text text-transparent">
              Chat
            </span>
          </h1>
          <p className="mt-3 text-slate-600 sm:text-lg dark:text-slate-400">
            Pick a mentor and start the conversation
          </p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {PERSONAS.map((persona) => (
            <div
              key={persona.id}
              className="flex flex-col items-center gap-3 rounded-3xl border border-white/50 bg-white/50 p-8 text-center shadow-xl shadow-purple-500/10 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-accent/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-white/6 dark:shadow-black/30"
            >
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
        </div>
      </main>
    </div>
  )
}

export default Home
