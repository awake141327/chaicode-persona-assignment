# Persona Chatbot — Technical Documentation

This document explains how the two built-in personas (**Hitesh Choudhary** and **Piyush Garg**) were built — where the persona data came from, how the prompts are engineered, how conversation context is managed, and real sample conversations — followed by the two features layered on top: a **custom persona builder** that lets users design their own coding mentor from a form, and the **liquid-glass frontend** (streaming, markdown, theming) they're all served through.

Contents:
1. How the persona data was collected and prepared
2. Prompt engineering strategy
3. Context management approach
4. Sample conversations
5. Custom persona builder
6. Frontend experience (streaming, markdown, theming)
7. Deployment

---

## 1. How the Persona Data Was Collected and Prepared

### Sources

All persona data comes from the educators' own public teaching content:

| Source | Hitesh Choudhary | Piyush Garg |
| --- | --- | --- |
| YouTube channels | [@HiteshCodeLab](https://www.youtube.com/@HiteshCodeLab), [@chaiaurcode](https://www.youtube.com/@chaiaurcode) | [@piyushgargdev](https://www.youtube.com/@piyushgargdev) |
| Blogs / sites | hitesh.ai | piyushgarg.dev |
| Other | Social posts on developer mindset and learning | Talks and posts about shipping fast |

### What was extracted

From that content, each persona was distilled into five kinds of raw material:

1. **Signature catchphrases** — the exact spoken lines each educator is known for ("Chai pilo pehle", "No magic in code, everything is logical", "Super cool, right?", "Samajh aya?"). These are kept **verbatim** in the prompts, because paraphrasing them would break recognizability.
2. **Tone and energy** — Hitesh: warm, patient, concepts-before-code; Piyush: high-energy, direct, code-first and deployment-focused.
3. **Topic affinities** — Hitesh: fundamentals, Docker, clean APIs, database design, open source; Piyush: Next.js App Router, TypeScript, Turborepo, AWS, Prisma/PostgreSQL/Redis.
4. **Language patterns** — both educators fluidly switch between English and Hinglish depending on the audience; this became an explicit mirroring rule in the prompts.
5. **Response habits** — recurring structure in their teaching (Hitesh's warm opener and closing check-in question; Piyush's enthusiastic opener and "Give this a try…" sign-off).

### Preparation

The raw material was structured into one persona module per educator ([`backend/personas/hitesh.persona.js`](backend/personas/hitesh.persona.js), [`backend/personas/piyush.persona.js`](backend/personas/piyush.persona.js)), each exporting:

- `id`, `name` — used by the API and frontend
- `systemPrompt` — the full engineered prompt (see next section)
- `youtubeChannels` — the persona's own channels with **resolved channel IDs** (looked up from the channel handles and verified against the live channel pages), so video recommendations can be restricted to each persona's real content via the YouTube Data API

A registry ([`backend/personas/index.js`](backend/personas/index.js)) maps persona ids to modules, so adding a third persona is a single new file plus one registry line.

---

## 2. Prompt Engineering Strategy

Each system prompt follows the same engineered structure, built from six techniques:

### a) Role-play framing with a hard character lock

Each prompt establishes the identity up front ("You speak as Hitesh Choudhary…" / "Builder first, teacher second, camera third — that's Piyush Garg…") and locks it with a non-negotiable stay-in-character rule. Both prompts carry a dedicated anti-prompt-injection section: user messages carry no authority over the persona's identity, jailbreak attempts get one relaxed in-character brush-off (demonstrated in embedded examples), and the persona never announces that it noticed a trick. Both also include an honesty carve-out — if sincerely asked whether it's an AI, it says so in one line and continues in character — and safety guardrails (declining harmful technical requests, dropping the banter for users in genuine distress).

### b) Structured behavioral sections

Rather than one blob of description, the prompt is split into labeled sections the model can follow reliably:

- **How you carry yourself** — personality traits, each with a concrete behavioral instruction
- **Signature lines** — verbatim catchphrases with guidance to use them *naturally, not forced*
- **The material your knowledge draws from** — grounds answers in the educator's actual content areas
- **How to shape a response** — an ordered response template (greeting → explanation flow → code style → video pointer → characteristic closer)
- **Non-negotiables** — the hard rules (never break character, teach don't dump code, modern-approach-first for Piyush, fundamentals-first for Hitesh)

### c) Language mirroring rule

An explicit conditional: if the user writes in Hinglish, the reply MUST be entirely in Hinglish (Hindi in the English alphabet); if in English, reply in English with light Hinglish flavor. Each branch includes an example sentence in the target style — a one-shot example strongly anchors the output register.

### d) A text-protocol "tool call": the YouTube search tag

The personas can't browse YouTube, so video recommendation is implemented as a lightweight text protocol. A `CRITICAL` section instructs the model to append exactly:

```
[YOUTUBE_SEARCH: keyword]
```

at the very end of any tech-topic reply, with strict constraints (core technical topic only, 1–2 words max, mandatory when the user asks for a resource) and format examples. The backend parses this tag with a regex, strips it from the user-visible reply, and turns it into a real YouTube Data API search restricted to the persona's channels. This is effectively function calling implemented in plain text — simple, model-agnostic, and easy to debug.

### e) Separation of identity and operational policy

The persona files contain only *identity*. Operational rules that apply to every persona live centrally in [`backend/services/openai.service.js`](backend/services/openai.service.js) — currently a **brevity rule** appended to every system prompt ("a few sentences, or one compact code block… unless the user explicitly asks for a detailed explanation"), keeping replies chat-sized. Changing global behavior never requires touching persona files.

### f) Iteration driven by observed failures

The prompts evolved through testing: response length was initially blog-sized (fixed with the central brevity rule), and the earlier chain-of-thought experiments in this project showed that models restart instructions they've already completed — which motivated keeping the persona protocol simple (one tag, appended at the end) instead of a multi-step format.

---

## 3. Context Management Approach

### Stateless backend, client-owned history

The backend keeps **no server-side session state**. Every `POST /api/chat` request carries the full conversation history (`messages: [{ role, content }, …]`), and the controller prepends the persona's system prompt before calling the model:

```
[ system: persona prompt + brevity rule ]
[ user / assistant turns … from the client ]
```

This makes the API horizontally scalable, trivially debuggable (each request is self-contained), and lets the frontend fully control what the model sees.

### What the client sends — and what it doesn't

The frontend keeps richer message objects than the model needs (each assistant message also stores its `videos` array for rendering). Before sending, it maps history down to `role`/`content` only — UI metadata never pollutes the model context.

### Per-persona isolation

Switching personas **resets the conversation**. Histories are never mixed across personas, so Hitesh's replies can never leak into Piyush's context or vice versa.

### Streaming without leaking the protocol

Replies stream over Server-Sent Events. Because the `[YOUTUBE_SEARCH: …]` tag arrives in fragments at the end of the stream, the controller uses a **holdback buffer**: any text that could be the start of the tag is withheld until it's confirmed either way, so the raw protocol never flashes on the user's screen. After the stream ends, the tag keyword is resolved into video results and delivered in a final `{ done, videos }` event.

### Keeping context — and cost — bounded

Three deliberate choices bound token usage:

1. The central **brevity rule** keeps each assistant turn short by instruction.
2. **Per-persona sessions** (reset on switch, no persistence across reloads) keep histories naturally shallow.
3. A hard **`max_completion_tokens` ceiling** on every model call (in `openai.service.js`) is the real safety net — it caps the cost of any single reply and stops runaway generation regardless of what the prompt or user asks for. Because `gpt-5-mini` spends internal *reasoning* tokens against this same budget, the ceiling is set with headroom so an everyday reply never hits it; only a request for an exhaustive, essay-length answer would be capped, which is the intended behavior. Note the API requires `max_completion_tokens` here — the older `max_tokens` parameter is rejected by gpt-5 models.

A future improvement would be windowing or summarizing history beyond N turns.

---

## 4. Sample Conversations

The transcripts below are **real, unedited outputs** captured from the running app (model: `gpt-5-mini`; video recommendations fetched live from the YouTube Data API, restricted to each persona's channels).

### Hitesh Choudhary — English query

> **User:** Should I learn React directly or master JavaScript first?

> **Hitesh persona:** Chai pilo pehle — good question, aur bahut important decision hai for your career.
>
> Short answer: Master JavaScript first, then learn React.
>
> Why (simple):
> - React is a library built on top of JavaScript. Agar JS ke fundamentals strong nahin honge, React samajhna aur debug karna painful ho jayega. No magic in code, everything is logical.
> - Core JS topics that matter: DOM, ES6+ (let/const, arrow functions, destructuring, modules), closures, this, promises/async-await, event loop, and fetch/XHR.
> - Also know basic HTML/CSS and how the browser renders pages — React doesn't replace those.
>
> Practical learning path (keep it simple, modular, and scalable):
> 1. Learn JS basics + ES6 features (2–4 weeks with daily practice).
> 2. Build tiny vanilla projects: todo list (DOM manipulation), fetch jokes or posts from an API, simple modal or tabs.
> 3. Learn module bundling and dev tooling basics (npm, babel, webpack or Vite).
> 4. Then start React: components, props, state, lifecycle/hooks, routing, and then state management patterns.
>
> Remember: Concepts before code. Start with fundamentals, then map them to React patterns. Chai pilo pehle, then let's write some clean production code. We will write production-grade code, not half-cooked scripts. Is this absolute clear, or do you want a day-by-day 4-week study plan I can give you?

> **📺 Recommended videos** (auto-attached from `[YOUTUBE_SEARCH: javascript]`):
> - "How to master javascript" — Chai aur Code
> - "Javascript in 1 shot in Hindi | part 1" — Chai aur Code
> - "Basics of functions in javascript" — Hitesh Choudhary
> - "Spread and REST operators in Javascript" — Hitesh Choudhary

Notice the persona markers: the chai opener, "No magic in code", concepts-before-code ordering, Hinglish seasoning inside an English reply, and the characteristic closing check-in question.

### Hitesh Choudhary — Hinglish query (language mirroring)

> **User:** Bhaiya, backend developer banne ke liye kya seekhna chahiye?

> **Hitesh persona:** Chai pilo pehle — bahut badiya sawaal! Backend developer banne ke liye seedha roadmap deta hoon, simple aur practical. […]
>
> Samajh lo (Why first)
> - Backend ka kaam: data ko store, process aur expose karna via APIs. No magic in code — everything is basic logic.
>
> Core skills (Must-learn)
> - Programming language: JavaScript (Node.js) / Python / Java — ek pe focus karo.
> - HTTP, REST, GraphQL, status codes, headers.
> - Databases: SQL (Postgres/MySQL) + NoSQL (MongoDB/Redis). […]
>
> Resources & mindset
> - Watch "Hitesh Choudhary" backend videos for guided tutorials — practice along.
> - There is no magic, it is basic logic. Let's keep it simple, modular, and scalable.
>
> Koi specific stack choose karna chahte ho (Node/Python/Java)? Batado, roadmap aur mini-project bata deta hoon.

> **📺 Recommended videos:** "Complete Backend Developer course | Part 1" (Chai aur Code), "Javascript Backend Roadmap | chai aur backend" (Chai aur Code), "Best frontend and backend projects for resume" (Hitesh Choudhary), "Pro backend developer course" (Hitesh Choudhary)

The Hinglish input triggered a fully Hinglish response, per the mirroring rule — same persona, different register.

### Piyush Garg — English query

> **User:** How should I deploy my Node.js app using Docker?

> **Piyush persona:** Love this — fast and practical. Let's spin up a Docker container and test it out.
>
> Below is a modern, production-ready pattern (multi-stage, non-root user, small image, healthcheck). Copy-paste and run.
>
> ```dockerfile
> # Stage 1 — build
> FROM node:20-alpine AS builder
> WORKDIR /app
> ENV NODE_ENV=production
> COPY package*.json yarn.lock ./
> RUN yarn install --frozen-lockfile
> COPY . .
> RUN yarn build
>
> # Stage 2 — runtime
> FROM node:20-alpine AS runtime
> WORKDIR /app
> RUN addgroup -S app && adduser -S app -G app
> COPY --from=builder /app/node_modules ./node_modules
> COPY --from=builder /app/dist ./dist
> USER app
> EXPOSE 3000
> CMD ["node", "dist/server.js"]
> ```
>
> *(reply continues with .dockerignore, docker-compose, build/push commands, ECS/App Runner deployment notes and CI tips — trimmed here for length)*
>
> Check the setup notes, this is super easy. Give this a try and let me know if it works. Super cool, right? Samajh aya? Check out a Piyush Garg video for step-by-step deploys.

> **📺 Recommended videos** (auto-attached from `[YOUTUBE_SEARCH: docker]`):
> - "Docker In One Shot - Part 1" — Piyush Garg
> - "Docker Tutorial For Beginners in Hindi" — Piyush Garg

The contrast with Hitesh is visible immediately: straight into copy-paste-ready code and deployment tooling, ending with his signature sign-off.

### Piyush Garg — Hinglish query (language mirroring)

> **User:** Bhaiya monorepo kaise setup karu apne project ke liye?

> **Piyush persona:** Bhaiya — perfect question. Chal, seedha hands-on karte hain: Turborepo + Next.js (App Router) + shared packages. Code-first, no bakwaas. Let's create a Turborepo and manage this like a pro. Don't write legacy code, let's use the latest App Router. Samajh aya?
>
> Commands (quick bootstrap)
> ```bash
> mkdir my-monorepo && cd my-monorepo
> git init
> pnpm init -w -y
> pnpm add -w turbo typescript -D
> mkdir -p apps/web packages/ui
> ```
>
> *(reply continues with complete root package.json, pnpm-workspace.yaml, turbo.json, tsconfig, a Next.js app and a shared UI package — trimmed here for length)*
>
> Check the setup notes, this is super easy. Super cool hai yeh. Give this a try and let me know if it works. Super cool, right? Samajh aya?

> **📺 Recommended videos:** "Build Scaleable Realtime Chat App with NextJS and NodeJS Tutorial" — Piyush Garg (and one more from his channel)

Again the mirroring rule kicks in (Hinglish in → Hinglish out), while the persona stays modern-stack-first: Turborepo, pnpm, App Router — exactly the stack affinities encoded in his prompt.

---

## 5. Custom Persona Builder

Beyond the two hand-crafted personas, users can create their own coding mentor through a form. The design goal was to reuse the exact same chat pipeline — a custom persona is indistinguishable from a built-in one once created.

### The form

At [`frontend/src/pages/CreatePersona.jsx`](frontend/src/pages/CreatePersona.jsx), the user:

1. Names the persona.
2. Chooses a **depth**: **5 questions** (quick sketch), **10** (well-rounded), or **20** (full character). The tiers are progressive — the first 5 are the core, 10 adds five more, 20 adds ten more.
3. Answers the shown questions (only the first 5 are required; the rest are optional).
4. Optionally adds free-form notes, **hard-limited to 100 words** with a live counter.

The questions are all programming-themed — area of expertise, teaching style, favourite stack, catchphrases, coding philosophy, pet peeves, how they handle basic questions, their debugging philosophy, take on AI tools, and so on. They live in a **single catalog** in [`backend/services/promptBuilder.service.js`](backend/services/promptBuilder.service.js) and are served to the frontend via `GET /api/personas/questions`, so there's one source of truth.

### From answers to a system prompt

`buildSystemPrompt(name, answers, extraNotes)` turns the form into a prompt in the same engineered style as the built-ins: it quotes each answer as a labelled "brief," then wraps it in the shared scaffolding every persona gets — a character lock, a language rule, the programming-only lane, safety guardrails, and the anti-injection section. Custom personas have **no YouTube channels**, so they carry no `[YOUTUBE_SEARCH]` tag instruction and the video pipeline simply returns an empty list for them.

Two safeguards worth noting:
- **Only visible answers are submitted.** If a user fills 20 questions then downsizes to 5, the hidden answers stay in local state (so they reappear if they switch back) but are *not* sent — the persona is shaped only by what the user can currently see.
- **Server-side validation** re-checks everything the form checks (name length, valid question ids, per-answer length, the 100-word notes cap), since the API can be called directly.

### Storage and lifecycle

Created personas are persisted to a JSON file via [`backend/services/personaStore.service.js`](backend/services/personaStore.service.js), loaded into memory at startup. The persona registry's `getPersona()` checks built-ins first, then the store — which is why a custom persona flows through the identical `/api/chat` path. Custom personas appear as cards on the home page (with an initials avatar on a deterministic gradient, since they have no image) and can be deleted. On the deployed backend (Railway), the filesystem is ephemeral, so custom personas reset on redeploy — an acceptable trade for a demo, called out so it isn't a surprise.

### New endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/personas/questions` | The tiered question catalog + valid counts |
| `GET` | `/api/personas` | List user-created personas (public fields only) |
| `POST` | `/api/personas` | Create a persona from form answers |
| `DELETE` | `/api/personas/:id` | Remove a user-created persona |

---

## 6. Frontend Experience

The frontend is a React + Vite SPA styled with **Tailwind CSS v4** in a "liquid glass" (glassmorphism) theme — translucent, blurred panels floating over an animated gradient backdrop.

- **Theming**: a Light / Dark / **System** switch (`ThemeContext` + `ThemeToggle`), with System following the OS live via `matchMedia`. A tiny pre-paint script in `index.html` applies the saved theme before first render to avoid a flash of the wrong theme.
- **Streaming replies**: assistant messages stream token-by-token over Server-Sent Events (see §3), with a persona-specific "thinking" line while the first token is pending (Hitesh sips chai; Piyush is "architecting the perfect answer").
- **Markdown rendering**: replies are rendered through `react-markdown`, so fenced code blocks get a proper dark panel with a language label and horizontal scroll, and inline code, lists, bold and links all format correctly. It renders no raw HTML, so it's XSS-safe. User messages stay plain text.
- **Starter suggestions**: when a chat is fresh, four persona-specific prompt chips are offered (custom personas fall back to a generic set); clicking one sends it immediately.
- **Accessibility & responsiveness**: a hidden `aria-live` region announces streamed replies to screen readers, animations respect `prefers-reduced-motion`, long code and URLs wrap instead of breaking the layout, and everything reflows from mobile to desktop.

These were hardened via multi-agent review passes that surfaced and fixed concrete issues (contrast on glass panels, reduced-motion support, emoji names breaking initials avatars, hidden-answer leakage in the builder), rather than shipped on first draft.

---

## 7. Deployment

The app is split across two hosts:

- **Frontend → Vercel** (static Vite build). A `vercel.json` rewrites all routes to `index.html` so client-side routing survives refreshes. The backend URL comes from a build-time `VITE_API_URL` env var (falls back to `localhost:8000` for local dev).
- **Backend → Railway** (long-running Express server, so SSE streaming works as-is). Secrets (`OPENAI_API_KEY`, `YOUTUBE_API_KEY`) and the frontend origin (`FRONTEND_URL`, for the CORS allowlist) are set as environment variables.

CORS is locked to an allowlist (localhost dev ports plus `FRONTEND_URL`) rather than left open.

---

## Appendix: Where everything lives

| Concern | File |
| --- | --- |
| Built-in persona prompts + channels | `backend/personas/*.persona.js` |
| Persona registry (built-ins + custom) | `backend/personas/index.js` |
| Brevity rule + token cap + streaming model call | `backend/services/openai.service.js` |
| Tag parsing, SSE streaming, holdback buffer | `backend/controllers/chat.controller.js` |
| Channel-restricted video search | `backend/services/youtube.service.js` |
| Custom persona: question catalog + prompt builder | `backend/services/promptBuilder.service.js` |
| Custom persona: JSON store | `backend/services/personaStore.service.js` |
| Custom persona: validation + CRUD | `backend/controllers/persona.controller.js` |
| Client history management + streaming render | `frontend/src/pages/Chat.jsx` |
| Custom persona builder form | `frontend/src/pages/CreatePersona.jsx` |
| Home page (persona cards + create) | `frontend/src/pages/Home.jsx` |
| Markdown renderer for replies | `frontend/src/components/MarkdownMessage.jsx` |
| Theme (Light/Dark/System) | `frontend/src/theme/ThemeContext.jsx` |
| Frontend persona config (greetings, starters, thinking lines) | `frontend/src/personas.js` |
