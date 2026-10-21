import EventCard from './EventCard.jsx'
import { groupEventsByDate } from '../lib/events.js'
import { formatDay } from '../lib/weekend.js'

// "Events this weekend": one heading per day, with that day's event cards.
function EventList({ events, dates, placeName }) {
  if (events.length === 0) {
    return (
      <p className="events-empty">
        No events found this weekend near {placeName}. Try a nearby larger city.
      </p>
    )
  }

  const groups = groupEventsByDate(events, dates)

  return (
    <>
      {groups.map((group) => (
        <section className="event-day" key={group.date} aria-labelledby={`day-${group.date}`}>
          <h3 id={`day-${group.date}`}>
            {formatDay(group.date)}{' '}
            <span className="event-count">
              · {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
            </span>
          </h3>

          {group.events.length === 0 ? (
            <p className="events-empty">No events listed for this day.</p>
          ) : (
            <ul className="event-grid">
              {group.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </>
  )
}

export default EventList
