# chaicode-persona-assignment

Persona-based chatbot — chat with AI personas of **Hitesh Choudhary** and **Piyush Garg**. React frontend, Express backend, OpenAI for the personas, YouTube Data API for video suggestions.

## Structure

```
frontend/   React + React Router + Axios (Vite)
  src/
    personas.js          persona cards config (name, image, greeting)
    api/client.js        axios instance + API methods
    pages/Home.jsx       persona selection screen
    pages/Chat.jsx       chat UI with video suggestions
backend/    Express API
  server.js              app entry, mounts routes
  routes/                API route definitions
  controllers/           request/response handling
  services/              openai.service.js, youtube.service.js
  personas/              system prompts per persona
```

## Setup

Create `backend/.env` (see `backend/.env.example`):

```
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...   # optional — video suggestions are skipped without it
```

## Running

Backend (http://localhost:8000):

```bash
cd backend
npm install
npm run dev
```

Frontend (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

## How it works

1. Pick a persona on the home page and start chatting.
2. The backend prepends the persona's system prompt and sends the conversation to OpenAI.
3. When the reply covers a tech topic, the persona appends a `[YOUTUBE_SEARCH: keyword]` tag. The backend strips the tag, searches the persona's YouTube channels ([@HiteshCodeLab](https://www.youtube.com/@HiteshCodeLab), [@chaiaurcode](https://www.youtube.com/@chaiaurcode)) via the YouTube Data API, and returns matching videos, which the frontend renders as clickable cards.

## API

- `POST /api/chat` — body `{ persona: "hitesh" | "piyush", messages: [{ role, content }] }`, returns `{ reply, videos }`.

> The Piyush Garg persona is currently a placeholder — detailed persona context coming soon.
