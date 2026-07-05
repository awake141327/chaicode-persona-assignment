# chaicode-persona-assignment

ChaiCode persona assignment — a chatbot with a React frontend and an Express backend.

## Structure

```
frontend/   React + React Router + Axios (Vite)
  src/
    api/client.js       axios instance + API methods
    pages/Chat.jsx      chatbot UI
backend/    Express API
  server.js             app entry, mounts routes
  routes/               API route definitions
  controllers/          request/response handling
  services/             business logic (e.g. wttr.in weather fetch)
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

Then open the frontend and ask something like **"What is the weather in Mumbai?"**

## API

- `GET /api/weather/:city` — returns `{ city, weather }` using the free [wttr.in](https://wttr.in) service (no API key needed).
