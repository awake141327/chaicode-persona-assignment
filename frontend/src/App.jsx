import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import GlassBackground from './components/GlassBackground.jsx'

function App() {
  return (
    <ThemeProvider>
      <GlassBackground />
      <div className="min-h-dvh font-sans text-slate-800 antialiased dark:text-slate-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:personaId" element={<Chat />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
