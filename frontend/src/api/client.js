import axios from 'axios'

// Single axios instance for all backend calls.
// Add new API methods here as the backend grows.
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// Sends the whole conversation so far; the backend prepends the
// persona's system prompt. Returns { reply, videos }.
export async function sendChatMessage(personaId, messages) {
  const response = await apiClient.post('/chat', {
    persona: personaId,
    messages,
  })
  return response.data
}

export default apiClient
