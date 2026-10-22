// Guesses whether an event is indoors or outdoors.
//
// Ticketmaster doesn't say, so this is a best guess from the venue name, the
// event name and the type of event. Rules, in order:
//   1. Indoor clues in the venue name win ("Stubb's Indoors", "Intuit Dome").
//   2. Then outdoor clues ("Red Rocks Amphitheatre", a football game, a festival).
//   3. Otherwise we assume indoors (most theatres, clubs and arenas are).
// Returns { setting: 'indoor' | 'outdoor', reason: 'why we think so' }.

// Venue words that mean "indoors", even if an outdoor word also appears.
const INDOOR_VENUE_WORDS = [
  'indoor', 'indoors', 'dome', 'arena', 'center', 'centre', 'theater', 'theatre', 'hall',
  'club', 'nightclub', 'lounge', 'ballroom', 'museum', 'church', 'cinema', 'casino',
]

// Big stadiums with a fixed roof (their names don't say so).
const COVERED_STADIUMS = [
  'sofi stadium', 'allegiant stadium', 'at&t stadium', 'u.s. bank stadium',
  'ford field', 'lucas oil stadium', 'nrg stadium', 'state farm stadium',
  'mercedes-benz stadium', 'caesars superdome', 'rogers centre',
]

// Venue words that suggest "outdoors".
const OUTDOOR_VENUE_WORDS = [
  'amphitheater', 'amphitheatre', 'park', 'ballpark', 'stadium', 'field', 'bowl',
  'gardens', 'botanical', 'beach', 'lawn', 'backyard', 'pier', 'rooftop', 'zoo',
  'fairgrounds', 'raceway', 'speedway', 'racetrack', 'circuit', 'outdoor', 'outdoors',
  'open air', 'open-air', 'festival', 'fest',
]

// Event-name words that suggest "outdoors" (kept short: names can be anything).
const OUTDOOR_EVENT_WORDS = ['festival', 'fest', 'outdoor', 'outdoors', 'open air', 'open-air']

// Sports that are usually played outside (when not in a covered venue).
const OUTDOOR_GENRES = [
  'baseball', 'football', 'soccer', 'golf', 'motorsports/racing', 'rugby', 'cricket',
]

// Finds the first word from `words` that appears as a whole word in `text`.
// Whole words only, so "theater" does NOT match inside "amphitheater".
function findWord(text, words) {
  const lower = text.toLowerCase()
  return words.find((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z])${escaped}($|[^a-z])`).test(lower)
  })
}

export function classifyEvent(event) {
  const venueName = event.venue?.name ?? ''
  const eventName = event.name ?? ''
  const genre = (event.genre ?? '').toLowerCase()

  // 1. Indoor clues in the venue name come first.
  const coveredStadium = COVERED_STADIUMS.find((name) => venueName.toLowerCase().includes(name))
  if (coveredStadium) {
    return { setting: 'indoor', reason: `${venueName} has a roof` }
  }
  const indoorWord = findWord(venueName, INDOOR_VENUE_WORDS)
  if (indoorWord) {
    return { setting: 'indoor', reason: `The venue name mentions "${indoorWord}"` }
  }

  // 2. Outdoor clues.
  const outdoorVenueWord = findWord(venueName, OUTDOOR_VENUE_WORDS)
  if (outdoorVenueWord) {
    return { setting: 'outdoor', reason: `The venue name mentions "${outdoorVenueWord}"` }
  }
  const outdoorEventWord = findWord(eventName, OUTDOOR_EVENT_WORDS)
  if (outdoorEventWord) {
    return { setting: 'outdoor', reason: `The event name mentions "${outdoorEventWord}"` }
  }
  if (OUTDOOR_GENRES.includes(genre)) {
    return { setting: 'outdoor', reason: `${event.genre} is usually played outdoors` }
  }

  // 3. No outdoor clues: assume indoors.
  return { setting: 'indoor', reason: 'No outdoor clues found, so we assume indoors' }
}
