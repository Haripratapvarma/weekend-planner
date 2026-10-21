// Talks to Open-Meteo (free, no API key needed):
// 1. findCity: city name -> place with coordinates and time zone
// 2. getWeekendForecast: place + weekend dates -> one forecast per day

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

const NETWORK_ERROR =
  "We couldn't reach the weather service. Check your internet connection and try again."
const LOCATION_SERVICE_ERROR =
  'The location service is having trouble right now. Please try again in a minute.'
const FORECAST_SERVICE_ERROR =
  'The weather service is having trouble right now. Please try again in a minute.'

// Places that use Fahrenheit and mph: the United States and its territories.
const IMPERIAL_COUNTRIES = ['US', 'PR', 'GU', 'VI', 'AS', 'MP']

// Fetches a URL and returns its JSON. Throws a friendly message on failure.
async function fetchJson(url, serviceErrorMessage) {
  let response
  try {
    response = await fetch(url)
  } catch {
    // fetch() only throws when the request couldn't be sent at all (e.g. offline).
    throw new Error(NETWORK_ERROR)
  }

  if (!response.ok) {
    throw new Error(serviceErrorMessage)
  }

  return response.json()
}

// Turns a city name like "Paris" into a place with coordinates and a time zone.
// Throws an Error with a friendly, ready-to-show message if anything goes wrong.
export async function findCity(cityName) {
  const url = new URL(GEOCODING_URL)
  url.searchParams.set('name', cityName)
  url.searchParams.set('count', '1') // just the best match
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const data = await fetchJson(url, LOCATION_SERVICE_ERROR)

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
    countryCode: place.country_code ?? '',
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  }
}

// Which units to show for a place: °F and mph in the US, °C and km/h elsewhere.
export function unitsFor(countryCode) {
  return IMPERIAL_COUNTRIES.includes(countryCode)
    ? { temperature: '°F', wind: 'mph', apiTemperature: 'fahrenheit', apiWind: 'mph' }
    : { temperature: '°C', wind: 'km/h', apiTemperature: 'celsius', apiWind: 'kmh' }
}

// Rounds a number, but keeps "unknown" (null) as null instead of turning it into 0.
function roundOrNull(value) {
  return typeof value === 'number' ? Math.round(value) : null
}

// Gets the forecast for the given weekend dates ("YYYY-MM-DD" strings).
// Returns { units, days: [{ date, code, high, low, rainChance, windMax }, ...] }.
export async function getWeekendForecast(place, dates) {
  const units = unitsFor(place.countryCode)

  const url = new URL(FORECAST_URL)
  url.searchParams.set('latitude', place.latitude)
  url.searchParams.set('longitude', place.longitude)
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
  )
  url.searchParams.set('timezone', place.timezone) // so "Friday" means Friday in that city
  url.searchParams.set('start_date', dates[0])
  url.searchParams.set('end_date', dates[dates.length - 1])
  url.searchParams.set('temperature_unit', units.apiTemperature)
  url.searchParams.set('wind_speed_unit', units.apiWind)

  const data = await fetchJson(url, FORECAST_SERVICE_ERROR)
  const daily = data.daily

  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    throw new Error(FORECAST_SERVICE_ERROR)
  }

  // Open-Meteo sends one list per measurement (all dates, all highs, ...).
  // We turn that into one object per day, which is easier to display.
  const days = daily.time.map((date, i) => ({
    date,
    code: daily.weather_code[i],
    high: roundOrNull(daily.temperature_2m_max[i]),
    low: roundOrNull(daily.temperature_2m_min[i]),
    rainChance: roundOrNull(daily.precipitation_probability_max[i]),
    windMax: roundOrNull(daily.wind_speed_10m_max[i]),
  }))

  return { units, days }
}
