import { Link } from 'react-router-dom'
import { PERSONAS } from '../personas.js'

function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>ChaiCode Persona Chat</h1>
        <p>Pick a mentor and start the conversation</p>
      </header>

      <div className="persona-grid">
        {PERSONAS.map((persona) => (
          <div key={persona.id} className="persona-card">
            <img src={persona.image} alt={persona.name} />
            <h2>{persona.name}</h2>
            <p>{persona.tagline}</p>
            <Link to={`/chat/${persona.id}`} className="persona-chat-button">
              Chat with {persona.name.split(' ')[0]}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
