// The secret-keeping middleman (a Vercel Serverless Function).
//
// The browser calls:  /api/events?lat=30.27&lon=-97.74&start=2026-10-23&end=2026-10-25
// This code runs on Vercel's servers (never in the browser), adds the secret
// Ticketmaster key, and sends back a short, simple list of events.
// The key itself is never sent to the browser.

const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
const SEARCH_RADIUS_MILES = 25
const MAX_EVENTS = 50
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const MAX_DAYS = 3 // Friday to Sunday; also stops anyone asking for a huge range
const RETRY_DELAY_MS = 1100 // how long to wait before retrying when told to slow down

// "2026-10-23" plus 1 day -> "2026-10-24".
function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// Every date from start to end, e.g. ["2026-10-23", "2026-10-24", "2026-10-25"].
function datesBetween(start, end) {
  const dates = []
  for (let date = start; date <= end && dates.length <= MAX_DAYS; date = addDays(date, 1)) {
    dates.push(date)
  }
  return dates
}

// Picks a wide (16:9) image around 640px wide; falls back to any image.
function pickImage(images = []) {
  const wide = images.filter((image) => image.ratio === '16_9')
  const choices = (wide.length > 0 ? wide : images)
    .slice()
    .sort((a, b) => a.width - b.width)
  const image = choices.find((img) => img.width >= 640) ?? choices.at(-1)
  return image?.url ?? null
}

// Turns one big Ticketmaster event into the few fields our app needs.
function simplifyEvent(event) {
  const venue = event._embedded?.venues?.[0]
  const classification = event.classifications?.[0]

  return {
    id: event.id,
    name: event.name,
    url: event.url,
    image: pickImage(event.images),
    date: event.dates?.start?.localDate ?? null, // "2026-10-23", in the city's time
    time: event.dates?.start?.localTime ?? null, // "19:30:00", or null if not announced
    venue: {
      name: venue?.name ?? 'Venue to be announced',
      city: venue?.city?.name ?? '',
      address: venue?.address?.line1 ?? '',
    },
    // Used later to guess indoor vs outdoor (e.g. "Music" / "Festival").
    segment: classification?.segment?.name ?? '',
    genre: classification?.genre?.name ?? '',
  }
}

// Sends an error the app can show as-is. It never contains the API key.
function sendError(res, status, message) {
  return res.status(status).json({ error: message })
}

// A problem we can turn into a friendly reply (status + message for the app).
class FriendlyError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Asks Ticketmaster for the most relevant events on ONE local date.
// We ask day by day so busy cities still show Saturday and Sunday events,
// instead of the first results all being on Friday.
async function fetchEventsForDay({ apiKey, latitude, longitude, date, size }) {
  const url = new URL(TICKETMASTER_URL)
  url.searchParams.set('apikey', apiKey)
  url.searchParams.set('latlong', `${latitude},${longitude}`)
  url.searchParams.set('radius', String(SEARCH_RADIUS_MILES))
  url.searchParams.set('unit', 'miles')
  // A range in the city's own local time, so time zones can't shift the day.
  url.searchParams.set('localStartDateTime', `${date}T00:00:00,${date}T23:59:59`)
  url.searchParams.set('sort', 'relevance,desc') // notable events first, not just the earliest
  url.searchParams.set('size', String(size))
  url.searchParams.set('locale', '*') // include events in every language

  let response
  try {
    response = await fetch(url)
    // Ticketmaster allows about 5 requests per second. If we're asked to slow
    // down (HTTP 429), wait a moment and try once more before giving up.
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      response = await fetch(url)
    }
  } catch {
    throw new FriendlyError(502, "We couldn't reach Ticketmaster. Please try again in a minute.")
  }

  if (response.status === 401 || response.status === 403) {
    // Log for the developer (shows in Vercel's logs), without the key.
    console.error(`Ticketmaster rejected the API key (HTTP ${response.status}).`)
    throw new FriendlyError(502, 'Events are unavailable right now (the event service rejected our key).')
  }
  if (response.status === 429) {
    throw new FriendlyError(503, 'Lots of people are searching right now. Please try again in a minute.')
  }
  if (!response.ok) {
    console.error(`Ticketmaster returned HTTP ${response.status}.`)
    throw new FriendlyError(502, 'The event service is having trouble right now. Please try again in a minute.')
  }

  const data = await response.json()
  return data._embedded?.events ?? [] // no "_embedded" means no events that day
}

// Sorts by date, then time; events without an announced time go last that day.
function byDateAndTime(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.time === b.time) return 0
  if (a.time === null) return 1
  if (b.time === null) return -1
  return a.time < b.time ? -1 : 1
}

export default async function handler(req, res) {
  // 1. Check what the browser sent.
  const { lat, lon, start, end } = req.query
  const latitude = Number(lat)
  const longitude = Number(lon)

  const validLocation =
    lat !== undefined &&
    lon !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  const validDates =
    DATE_PATTERN.test(start ?? '') && DATE_PATTERN.test(end ?? '') && start <= end
  const days = validDates ? datesBetween(start, end) : []

  if (!validLocation || !validDates || days.length > MAX_DAYS) {
    return sendError(
      res,
      400,
      `Please provide lat, lon, start and end (dates as YYYY-MM-DD, at most ${MAX_DAYS} days).`,
    )
  }

  // 2. Read the secret key from the server's environment (never from the browser).
  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey || apiKey === 'paste-your-key-here') {
    return sendError(
      res,
      500,
      'Events are not set up yet: the server is missing its Ticketmaster API key.',
    )
  }

  // 3. Ask Ticketmaster for each weekend day at the same time (in parallel),
  //    sharing the event limit between the days (about 17 each for 3 days).
  const perDay = Math.ceil(MAX_EVENTS / days.length)
  let eventsByDay
  try {
    eventsByDay = await Promise.all(
      days.map((date) =>
        fetchEventsForDay({ apiKey, latitude, longitude, date, size: perDay }),
      ),
    )
  } catch (err) {
    if (err instanceof FriendlyError) {
      return sendError(res, err.status, err.message)
    }
    console.error('Unexpected problem while loading events:', err.message)
    return sendError(res, 500, 'Something went wrong while loading events. Please try again.')
  }

  // 4. Combine the days, drop cancelled events, simplify, and sort by date/time.
  const events = eventsByDay
    .flat()
    .filter((event) => event.dates?.status?.code !== 'cancelled')
    .map(simplifyEvent)
    .filter((event) => event.date && event.date >= start && event.date <= end)
    .sort(byDateAndTime)
    .slice(0, MAX_EVENTS)

  // 5. Let Vercel reuse this answer for 10 minutes, to save Ticketmaster calls.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')
  return res.status(200).json({ events })
}
