import { formatTime } from '../lib/events.js'
import { classifyEvent } from '../lib/classify.js'

// Ticketmaster sometimes uses "Undefined" as a category; we just hide it.
function category(event) {
  return [event.segment, event.genre]
    .filter((name) => name && name !== 'Undefined')
    .filter((name, i, all) => all.indexOf(name) === i) // no "Music · Music"
    .join(' · ')
}

// One event: picture, name, time, venue, category and a ticket link.
function EventCard({ event }) {
  const venue = [event.venue.name, event.venue.city].filter(Boolean).join(', ')
  const label = category(event)
  const { setting, reason } = classifyEvent(event)

  return (
    <li className="event-card">
      {event.image ? (
        // The name is written right below, so the picture needs no extra description.
        <img
          className="event-image"
          src={event.image}
          alt=""
          loading="lazy"
          width="640"
          height="360"
        />
      ) : (
        <div className="event-image event-image-placeholder" aria-hidden="true">
          🎟️
        </div>
      )}

      <div className="event-body">
        <div className="event-tags">
          {/* Hovering the tag shows why we guessed indoor or outdoor. */}
          <span className={`setting-tag setting-${setting}`} title={reason}>
            <span aria-hidden="true">{setting === 'outdoor' ? '🌳 ' : '🏠 '}</span>
            {setting === 'outdoor' ? 'Outdoor' : 'Indoor'}
            <span className="visually-hidden"> (best guess: {reason})</span>
          </span>
          {label && <span className="event-category">{label}</span>}
        </div>
        <h4 className="event-name">{event.name}</h4>
        <p className="event-meta">
          <span aria-hidden="true">🕒 </span>
          {formatTime(event.time)}
        </p>
        <p className="event-meta">
          <span aria-hidden="true">📍 </span>
          {venue}
        </p>
        <a
          className="event-link"
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get tickets<span className="visually-hidden"> for {event.name} (opens in a new tab)</span>
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </li>
  )
}

export default EventCard
