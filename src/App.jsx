import { useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import Loading from './components/Loading.jsx'
import ErrorMessage from './components/ErrorMessage.jsx'
import { findCity } from './lib/weather.js'
import './App.css'

// Shows coordinates the way people read them, e.g. "48.85°N, 2.35°E".
function formatCoordinates(latitude, longitude) {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lon}`
}

function App() {
  // Which screen to show: 'idle' | 'loading' | 'error' | 'success'.
  const [status, setStatus] = useState('idle')
  // The city name being searched (used in the loading message).
  const [query, setQuery] = useState('')
  // The place Open-Meteo found, once a search succeeds.
  const [place, setPlace] = useState(null)
  // The friendly error message, if a search fails.
  const [error, setError] = useState('')

  async function handleSearch(cityName) {
    setQuery(cityName)
    setStatus('loading')
    setError('')

    try {
      const found = await findCity(cityName)
      setPlace(found)
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>What to do this weekend</h1>
        <p className="tagline">
          See the Friday–Sunday forecast and local events in one place.
        </p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={handleSearch} disabled={status === 'loading'} />

        {status === 'idle' && (
          <p className="placeholder">Search for a city to get started.</p>
        )}

        {status === 'loading' && <Loading message={`Finding ${query}…`} />}

        {status === 'error' && <ErrorMessage message={error} />}

        {status === 'success' && (
          <section className="place" aria-label="Selected city">
            <h2>
              <span aria-hidden="true">📍 </span>
              {/* Skip the region when it repeats the city ("Tokyo, Tokyo"). */}
              {[
                place.name,
                place.region === place.name ? '' : place.region,
                place.country,
              ]
                .filter(Boolean)
                .join(', ')}
            </h2>
            <p className="place-details">
              {formatCoordinates(place.latitude, place.longitude)} · Time zone:{' '}
              {place.timezone}
            </p>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Weather data by Open-Meteo · Event data by Ticketmaster</p>
      </footer>
    </div>
  )
}

export default App
