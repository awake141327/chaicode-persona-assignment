import { useEffect, useRef, useState } from 'react'
import { getWeather } from '../api/client.js'

// Pulls a city name out of messages like "weather in Mumbai" or
// "what is the weather of Delhi?". Falls back to null if not found.
function extractCity(message) {
  const match = message.match(/weather\s+(?:in|of|at|for)\s+([a-zA-Z\s]+)/i)
  if (match) return match[1].trim().replace(/[?.!]+$/, '')
  return null
}

function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hey! I am ChaiCode weather bot ☕. Ask me something like "What is the weather in Mumbai?"',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const city = extractCity(text)

      if (!city) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: 'I can only help with weather right now. Try asking "What is the weather in <city>?"',
          },
        ])
        return
      }

      const data = await getWeather(city)
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `The current weather in ${data.city} is ${data.weather}.`,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Oops, I could not reach the weather service. Is the backend running on port 8000?',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h1>ChaiCode Weather Bot</h1>
        <p>Ask about the weather in any city</p>
      </header>

      <main className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
        {loading && <div className="chat-bubble bot typing">Thinking...</div>}
        <div ref={bottomRef} />
      </main>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What is the weather in Mumbai?"
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
