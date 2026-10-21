import { useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import './App.css'

function App() {
  // The last city the user searched for ('' means nothing searched yet).
  const [city, setCity] = useState('')

  return (
    <div className="app">
      <header className="app-header">
        <h1>What to do this weekend</h1>
        <p className="tagline">
          See the Friday–Sunday forecast and local events in one place.
        </p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={setCity} />

        {city === '' ? (
          <p className="placeholder">Search for a city to get started.</p>
        ) : (
          <p className="result">
            You searched: <strong>{city}</strong>
          </p>
        )}
      </main>

      <footer className="app-footer">
        <p>Weather data by Open-Meteo · Event data by Ticketmaster</p>
      </footer>
    </div>
  )
}

export default App
