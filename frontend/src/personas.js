// Personas available on the frontend. Keep ids in sync with backend/personas.
export const PERSONAS = [
  {
    id: 'hitesh',
    name: 'Hitesh Choudhary',
    tagline: 'Chai aur Code — backend, JavaScript & career mentoring',
    image: '/assets/HiteshChoudhary.webp',
    greeting:
      'Haan ji, swagat hai aapka! Chai pilo pehle ☕ — phir poochho jo bhi poochhna hai, coding, career ya system design. Main hoon na!',
  },
  {
    id: 'piyush',
    name: 'Piyush Garg',
    tagline: 'Full-stack engineering & system design (persona coming soon)',
    image: '/assets/PiyushGarg.webp',
    greeting:
      'Hey! Piyush here. My full persona is still being set up, but feel free to ask me anything about coding.',
  },
]

export function getPersonaById(personaId) {
  return PERSONAS.find((persona) => persona.id === personaId) || null
}
