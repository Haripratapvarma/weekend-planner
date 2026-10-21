// Gets weekend events from OUR server function (/api/events), never from
// Ticketmaster directly, so the secret API key stays on the server.

const NETWORK_ERROR =
  "We couldn't load events. Check your internet connection and try again."
const GENERIC_ERROR = 'Events are unavailable right now. Please try again in a minute.'

// Returns a list of events for the place and weekend dates ("YYYY-MM-DD").
// Throws an Error with a friendly, ready-to-show message if anything goes wrong.
export async function getEvents(place, dates) {
  const params = new URLSearchParams({
    lat: String(place.latitude),
    lon: String(place.longitude),
    start: dates[0],
    end: dates[dates.length - 1],
  })

  let response
  try {
    response = await fetch(`/api/events?${params}`)
  } catch {
    throw new Error(NETWORK_ERROR)
  }

  // Our function always answers with JSON: { events: [...] } or { error: "..." }.
  let data = null
  try {
    data = await response.json()
  } catch {
    // Not JSON (e.g. the function isn't running): fall through to the generic error.
  }

  if (!response.ok || !data || !Array.isArray(data.events)) {
    throw new Error(data?.error ?? GENERIC_ERROR)
  }

  return data.events
}

// Puts events into one group per weekend day, in order, keeping empty days:
// [{ date: '2026-10-23', events: [...] }, { date: '2026-10-24', events: [] }, ...]
export function groupEventsByDate(events, dates) {
  return dates.map((date) => ({
    date,
    events: events.filter((event) => event.date === date),
  }))
}

// "19:30:00" -> "7:30 PM". Ticketmaster times are already the venue's local time.
export function formatTime(time) {
  if (!time) {
    return 'Time to be announced'
  }
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}
