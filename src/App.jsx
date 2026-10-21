import { useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import Loading from './components/Loading.jsx'
import ErrorMessage from './components/ErrorMessage.jsx'
import WeatherForecast from './components/WeatherForecast.jsx'
import { findCity, getWeekendForecast } from './lib/weather.js'
import { getWeekendDates, todayInTimeZone, formatDay } from './lib/weekend.js'
import './App.css'

// Shows coordinates the way people read them, e.g. "48.85°N, 2.35°E".
function formatCoordinates(latitude, longitude) {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`
  return `${lat}, ${lon}`
}

// e.g. "Fri, Oct 23 – Sun, Oct 25", or just "Sun, Oct 25" on a Sunday.
function describeWeekend(dates) {
  const first = formatDay(dates[0])
  const last = formatDay(dates[dates.length - 1])
  return dates.length === 1 ? first : `${first} – ${last}`
}

function App() {
  // Which screen to show: 'idle' | 'loading' | 'error' | 'success'.
  const [status, setStatus] = useState('idle')
  // What the spinner says, e.g. "Finding Paris…".
  const [loadingMessage, setLoadingMessage] = useState('')
  // The place Open-Meteo found, once a search succeeds.
  const [place, setPlace] = useState(null)
  // The weekend dates ("YYYY-MM-DD") for that place.
  const [weekendDates, setWeekendDates] = useState([])
  // The forecast: { units, days: [...] }.
  const [forecast, setForecast] = useState(null)
  // The friendly error message, if a search fails.
  const [error, setError] = useState('')

  async function handleSearch(cityName) {
    setStatus('loading')
    setError('')
    setLoadingMessage(`Finding ${cityName}…`)

    try {
      // 1. City name -> place (coordinates and time zone).
      const found = await findCity(cityName)

      // 2. Work out "this weekend" in that city's own time zone.
      const dates = getWeekendDates(todayInTimeZone(found.timezone))

      // 3. Get the forecast for just those days.
      setLoadingMessage(`Getting the weekend forecast for ${found.name}…`)
      const weekendForecast = await getWeekendForecast(found, dates)

      setPlace(found)
      setWeekendDates(dates)
      setForecast(weekendForecast)
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

        {status === 'loading' && <Loading message={loadingMessage} />}

        {status === 'error' && <ErrorMessage message={error} />}

        {status === 'success' && (
          <>
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
              <p className="weekend-range">
                <span aria-hidden="true">🗓️ </span>
                This weekend: <strong>{describeWeekend(weekendDates)}</strong>
              </p>
            </section>

            <WeatherForecast forecast={forecast} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Weather data by Open-Meteo · Event data by Ticketmaster</p>
      </footer>
    </div>
  )
}

export default App
