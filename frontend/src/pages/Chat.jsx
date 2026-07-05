import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { sendChatMessage } from '../api/client.js'
import { getPersonaById } from '../personas.js'

function Chat() {
  const { personaId } = useParams()
  const persona = getPersonaById(personaId)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Reset the conversation when switching personas
  useEffect(() => {
    if (persona) {
      setMessages([{ role: 'assistant', content: persona.greeting, videos: [] }])
    }
  }, [personaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!persona) {
    return <Navigate to="/" replace />
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      // Send only role/content — the backend doesn't need the videos field
      const history = nextMessages.map(({ role, content }) => ({ role, content }))
      const data = await sendChatMessage(persona.id, history)

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, videos: data.videos || [] },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Oops, something went wrong. Is the backend running on port 8000?',
          videos: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link to="/" className="back-link">
          ←
        </Link>
        <img src={persona.image} alt={persona.name} className="chat-avatar" />
        <div>
          <h1>{persona.name}</h1>
          <p>{persona.tagline}</p>
        </div>
      </header>

      <main className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.role}`}>
            <div className={`chat-bubble ${message.role}`}>{message.content}</div>

            {message.videos?.length > 0 && (
              <div className="video-suggestions">
                <p className="video-suggestions-title">📺 Recommended videos:</p>
                {message.videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="video-card"
                  >
                    <img src={video.thumbnail} alt="" />
                    <div>
                      <span className="video-title">{video.title}</span>
                      <span className="video-channel">{video.channelTitle}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-bubble assistant typing">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${persona.name.split(' ')[0]} anything...`}
          autoFocus
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat
