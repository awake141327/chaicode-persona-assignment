import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getCustomPersonas, streamChatMessage } from '../api/client.js'
import {
  DEFAULT_STARTERS,
  getPersonaById,
  personaGradient,
  personaInitials,
  pickThinkingLine,
} from '../personas.js'
import ThemeToggle from '../components/ThemeToggle.jsx'
import MarkdownMessage from '../components/MarkdownMessage.jsx'

function Chat() {
  const { personaId } = useParams()
  const staticPersona = getPersonaById(personaId)

  const [customPersona, setCustomPersona] = useState(null)
  const [resolving, setResolving] = useState(!staticPersona)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Random persona-flavoured "thinking" line, picked fresh per message
  const [thinkingLine, setThinkingLine] = useState('')
  // Announced via the visually-hidden live region for screen readers —
  // coarse states only, never per-token (that would spam the queue)
  const [announcement, setAnnouncement] = useState('')
  const bottomRef = useRef(null)

  const persona = staticPersona || customPersona

  // User-created personas aren't in the static config — look them up
  useEffect(() => {
    if (staticPersona) return
    let cancelled = false
    setCustomPersona(null)
    setResolving(true)
    getCustomPersonas()
      .then((list) => {
        if (cancelled) return
        setCustomPersona(list.find((p) => p.id === personaId) || null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setResolving(false)
      })
    return () => {
      cancelled = true
    }
  }, [personaId])

  // Reset the conversation when switching personas
  useEffect(() => {
    if (persona) {
      setMessages([{ role: 'assistant', content: persona.greeting, videos: [] }])
    }
  }, [persona?.id])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [messages])

  if (!persona) {
    if (resolving) {
      return (
        <div className="flex h-dvh items-center justify-center text-slate-600 dark:text-slate-400">
          Loading persona...
        </div>
      )
    }
    return <Navigate to="/" replace />
  }

  // Applies an update to the message currently being streamed (the last one)
  function updateLastMessage(update) {
    setMessages((prev) => {
      const next = [...prev]
      next[next.length - 1] = update(next[next.length - 1])
      return next
    })
  }

  function handleSend(e) {
    e.preventDefault()
    sendMessage(input)
  }

  async function sendMessage(rawText) {
    const text = rawText.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    // Add an empty assistant message that fills up as deltas stream in
    setMessages([...nextMessages, { role: 'assistant', content: '', videos: [] }])
    setInput('')
    setLoading(true)
    setThinkingLine(pickThinkingLine(persona))
    setAnnouncement(`${persona.name} is replying…`)

    let streamedReply = ''

    try {
      // Send only role/content — the backend doesn't need the videos field
      const history = nextMessages.map(({ role, content }) => ({ role, content }))

      await streamChatMessage(persona.id, history, {
        onDelta: (delta) => {
          streamedReply += delta
          updateLastMessage((message) => ({
            ...message,
            content: message.content + delta,
          }))
        },
        onDone: (videos) => {
          updateLastMessage((message) => ({ ...message, videos }))
          setAnnouncement(
            `${persona.name} replied: ${streamedReply}${
              videos.length ? ` ${videos.length} video recommendations available below the reply.` : ''
            }`
          )
        },
      })
    } catch {
      updateLastMessage((message) => ({
        ...message,
        content:
          message.content ||
          'Oops, something went wrong. Is the backend running on port 8000?',
      }))
      setAnnouncement('Something went wrong sending your message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-4xl flex-col px-2 sm:px-6">
      <header className="mt-2 flex items-center gap-3 rounded-2xl border border-white/50 bg-white/50 px-3 py-2.5 shadow-lg shadow-purple-500/10 backdrop-blur-2xl sm:mt-4 sm:px-4 dark:border-white/10 dark:bg-white/6 dark:shadow-black/30">
        <Link
          to="/"
          aria-label="Back to personas"
          className="rounded-full px-2 py-1 text-xl transition-colors hover:bg-white/60 dark:hover:bg-white/10"
        >
          ←
        </Link>
        <div className="rounded-full bg-linear-to-br from-accent via-fuchsia-500 to-cyan-400 p-0.5">
          {persona.image ? (
            <img
              src={persona.image}
              alt={persona.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`flex size-10 items-center justify-center rounded-full bg-linear-to-br text-sm font-bold text-white ${personaGradient(persona.id)}`}
            >
              {personaInitials(persona.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[16px] font-semibold">{persona.name}</h1>
          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
            {persona.tagline}
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <ThemeToggle />
        </div>
      </header>

      <main className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-5 sm:px-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col gap-2 ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed wrap-anywhere sm:max-w-[75%] ${
                message.role === 'user'
                  ? 'rounded-br-md whitespace-pre-wrap bg-linear-to-br from-purple-600 to-fuchsia-700 text-white shadow-lg shadow-accent/25'
                  : 'rounded-bl-md border border-white/50 bg-white/60 shadow-md shadow-purple-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/8 dark:shadow-black/20'
              }`}
            >
              {message.role === 'user' ? (
                message.content
              ) : message.content ? (
                <MarkdownMessage content={message.content} />
              ) : loading && index === messages.length - 1 ? (
                <span className="text-slate-500 italic dark:text-slate-400">
                  {thinkingLine}
                </span>
              ) : null}
            </div>

            {message.videos?.length > 0 && (
              <div className="flex w-full max-w-[85%] flex-col gap-2 sm:max-w-[75%]">
                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  📺 Recommended videos:
                </p>
                {message.videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/60 p-2 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-white/8"
                  >
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-24 shrink-0 rounded-xl sm:w-28"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="line-clamp-2 text-[13px] leading-snug font-semibold">
                        {video.title}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {video.channelTitle}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {messages.length === 1 && !loading && (
          <div className="mt-2 flex flex-col gap-2">
            <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
              Try asking:
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(persona.starters || DEFAULT_STARTERS).map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => sendMessage(starter)}
                  className="cursor-pointer rounded-2xl border border-white/50 bg-white/50 px-4 py-3 text-left text-sm text-slate-700 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md hover:shadow-accent/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-white/8 dark:text-slate-200"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <form
        className="mb-2 flex gap-2 rounded-2xl border border-white/50 bg-white/50 p-2 shadow-lg shadow-purple-500/10 backdrop-blur-2xl sm:mb-4 dark:border-white/10 dark:bg-white/6 dark:shadow-black/30"
        onSubmit={handleSend}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${persona.name.split(' ')[0]} anything...`}
          autoFocus
          className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2.5 text-[15px] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="cursor-pointer rounded-full bg-linear-to-r from-purple-600 to-fuchsia-700 px-6 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat
