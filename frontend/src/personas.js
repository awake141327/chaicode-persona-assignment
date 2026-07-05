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
    tagline: 'Next.js, TypeScript, Docker & AWS — build and ship like a pro',
    image: '/assets/PiyushGarg.webp',
    greeting:
      'Hey guys, Piyush here! 🚀 Ask me anything — Next.js, Docker, AWS deployments, system design. Let\'s build something super cool. Samajh aya?',
  },
]

export function getPersonaById(personaId) {
  return PERSONAS.find((persona) => persona.id === personaId) || null
}
