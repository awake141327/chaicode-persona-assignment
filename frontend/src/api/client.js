import axios from 'axios'

// In production set VITE_API_URL to the backend's origin
// (e.g. https://your-app.up.railway.app) — no trailing slash.
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`

// Axios instance for regular (non-streaming) backend calls.
// Add new API methods here as the backend grows.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// ---- Custom persona builder ----

export async function getQuestions() {
  const response = await apiClient.get('/personas/questions')
  return response.data // { questions: [...], counts: [5, 10, 20] }
}

export async function getCustomPersonas() {
  const response = await apiClient.get('/personas')
  return response.data.personas
}

export async function createPersona(payload) {
  const response = await apiClient.post('/personas', payload)
  return response.data.persona
}

export async function deletePersona(personaId) {
  await apiClient.delete(`/personas/${encodeURIComponent(personaId)}`)
}

// Streams a persona chat reply over Server-Sent Events.
// Axios can't read browser streams, so this one uses fetch.
// Calls onDelta(text) for each chunk and onDone(videos) at the end.
export async function streamChatMessage(personaId, messages, { onDelta, onDone }) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona: personaId, messages }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed with status ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line
    const events = buffer.split('\n\n')
    buffer = events.pop()

    for (const event of events) {
      const line = event.trim()
      if (!line.startsWith('data:')) continue

      const payload = JSON.parse(line.slice(5))
      if (payload.error) throw new Error(payload.error)
      if (payload.delta) onDelta(payload.delta)
      if (payload.done) onDone(payload.videos || [])
    }
  }
}

export default apiClient
