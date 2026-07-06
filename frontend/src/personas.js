// Personas available on the frontend. Keep ids in sync with backend/personas.
export const PERSONAS = [
  {
    id: "hitesh",
    name: "Hitesh Choudhary",
    tagline: "Chai aur Code — Web Dev, Backend & career mentoring",
    image: "/assets/HiteshChoudhary.webp",
    greeting:
      "Haan ji, swagat hai aapka! Chai pilo pehle ☕ — phir poochho jo bhi poochhna hai, coding, career ya system design. Main hoon na!",
    thinking: [
      "Chai ki chuski le raha hoon ☕...",
      "Haan ji, Soch raha hoon, ek second...",
      "Iska logic samjhata hoon ☕...",
      "Ruko, production-grade jawab bana raha hoon...",
    ],
    starters: [
      "React seekhu ya pehle JavaScript strong karu?",
      "Backend developer banne ka roadmap batao",
      "Docker kya hota hai, simple words mein?",
      "Kaise apne coding fundamentals strong karu?",
    ],
  },
  {
    id: "piyush",
    name: "Piyush Garg",
    tagline: "GenAI, TypeScript, Docker & AWS — build and ship like a pro",
    image: "/assets/PiyushGarg.webp",
    greeting:
      "Hey guys, Piyush here! 🚀 Honestly, you're in the right chat — GenAI, Docker, AWS, system design, I've shipped it all to production. Ask away, and I'll show you how I'd actually build it.",
    thinking: [
      "Architecting the perfect answer, like I always do 🚀...",
      "Okay so, applying my production-grade brain to this...",
      "Ye toh maine already 100 baar build kiya hai, ek sec...",
      "Cooking up the answer only I can give 🧠..",
      "Yaar dekho, main hi clean way se samjha sakta hoon...",
    ],
    starters: [
      "How do I deploy my Node.js app on AWS?",
      "Next.js App Router ya Pages Router — kya use karu?",
      "Kaise ek GenAI project shuru karu?",
      "System design kaise seekhein as a fresher?",
    ],
  },
];

// Shown while a user-created persona (no custom lines) is replying
export const DEFAULT_THINKING = [
  "Cooking up an answer 💡...",
  "Thinking it through...",
  "Putting this together...",
  "One second, working on it 💡...",
];

// Picks a random "thinking" line for a persona (falls back to the defaults)
export function pickThinkingLine(persona) {
  const pool = persona?.thinking?.length ? persona.thinking : DEFAULT_THINKING;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Shown for user-created personas, which have no hand-written starters
export const DEFAULT_STARTERS = [
  "What should I build to level up my skills?",
  "Explain a tricky concept in your area simply",
  "Review my approach to a coding problem",
  "What's a common mistake beginners make?",
];

export function getPersonaById(personaId) {
  return PERSONAS.find((persona) => persona.id === personaId) || null;
}

// ---- Helpers for user-created personas (no image, initials avatar) ----

export function personaInitials(name) {
  return (
    name
      .split(/\s+/)
      // [...word][0] takes the first code point, not the first UTF-16 code
      // unit, so emoji / astral-character names don't render a broken '�'
      .map((word) => [...word][0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );
}

const AVATAR_GRADIENTS = [
  "from-purple-500 to-fuchsia-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-600",
  "from-indigo-500 to-purple-600",
];

// Deterministic gradient per persona id so the avatar color is stable
export function personaGradient(personaId) {
  let hash = 0;
  for (const char of personaId) hash = (hash + char.charCodeAt(0)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}
