import { useState } from 'react'

// The city search box. It only collects a city name and hands it to the
// parent through `onSearch`. It doesn't fetch any data itself.
// `disabled` turns the button off while a search is already running.
function SearchBar({ onSearch, disabled = false }) {
  // What's currently typed in the box.
  const [text, setText] = useState('')
  // A friendly hint shown if someone presses Search with an empty box.
  const [hint, setHint] = useState('')

  function handleSubmit(event) {
    // Stop the browser's default behavior (reloading the page).
    event.preventDefault()

    const city = text.trim()
    if (city === '') {
      setHint('Type a city name first, like "Austin" or "London".')
      return
    }

    setHint('')
    onSearch(city)
  }

  return (
    <form className="search" onSubmit={handleSubmit} role="search">
      <label htmlFor="city-input" className="visually-hidden">
        City
      </label>
      <input
        id="city-input"
        type="text"
        placeholder="Enter a city, e.g. Austin"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoComplete="address-level2"
        aria-describedby="search-hint"
      />
      <button type="submit" disabled={disabled}>
        {disabled ? 'Searching…' : 'Search'}
      </button>
      <p id="search-hint" className="search-hint" aria-live="polite">
        {hint}
      </p>
    </form>
  )
}

export default SearchBar
