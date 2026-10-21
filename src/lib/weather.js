// Talks to Open-Meteo (free, no API key needed).
// For now it only finds a city. The forecast comes in Step 6.

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'

const NETWORK_ERROR =
  "We couldn't reach the weather service. Check your internet connection and try again."
const SERVICE_ERROR =
  'The location service is having trouble right now. Please try again in a minute.'

// Turns a city name like "Paris" into a place with coordinates and a time zone.
// Throws an Error with a friendly, ready-to-show message if anything goes wrong.
export async function findCity(cityName) {
  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', cityName)
  url.searchParams.set('count', '1') // just the best match
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  let response
  try {
    response = await fetch(url)
  } catch {
    // fetch() only throws when the request couldn't be sent at all (e.g. offline).
    throw new Error(NETWORK_ERROR)
  }

  if (!response.ok) {
    throw new Error(SERVICE_ERROR)
  }

  const data = await response.json()

  // When nothing matches, Open-Meteo leaves out the "results" list entirely.
  if (!data.results || data.results.length === 0) {
    throw new Error(
      `We couldn't find "${cityName}". Check the spelling or try a nearby larger city.`,
    )
  }

  const place = data.results[0]
  return {
    name: place.name,
    region: place.admin1 ?? '', // state or province; some places don't have one
    country: place.country ?? '',
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  }
}
