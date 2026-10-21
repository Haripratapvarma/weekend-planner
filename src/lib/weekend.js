// Works out which dates count as "this weekend".
//
// Dates are plain "YYYY-MM-DD" strings (the same format Open-Meteo uses).
// Internally we treat them as midnight UTC, so the computer's own time zone
// can never shift a date by a day.

const FRIDAY = 5
const SATURDAY = 6
const SUNDAY = 0

// "2026-10-23" -> a Date at midnight UTC on that day.
function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00Z`)
}

// A Date -> "2026-10-23".
function toDateString(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(dateString, days) {
  const date = parseDate(dateString)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateString(date)
}

// Today's date in a given time zone, e.g. todayInTimeZone('Asia/Tokyo').
// `now` can be passed in so tests can pretend it's a specific moment.
export function todayInTimeZone(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const get = (type) => parts.find((part) => part.type === type).value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// The weekend days that are still ahead, starting from `today`:
// - Monday to Thursday: the coming Friday, Saturday and Sunday
// - Friday:   Friday, Saturday, Sunday
// - Saturday: Saturday, Sunday
// - Sunday:   Sunday
export function getWeekendDates(today) {
  const dayOfWeek = parseDate(today).getUTCDay() // 0 = Sunday ... 6 = Saturday

  if (dayOfWeek === SUNDAY) {
    return [today]
  }
  if (dayOfWeek === SATURDAY) {
    return [today, addDays(today, 1)]
  }

  const daysUntilFriday = FRIDAY - dayOfWeek // 0 on Friday, 4 on Monday
  const friday = addDays(today, daysUntilFriday)
  return [friday, addDays(friday, 1), addDays(friday, 2)]
}

// "2026-10-23" -> "Fri, Oct 23".
export function formatDay(dateString) {
  return parseDate(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
