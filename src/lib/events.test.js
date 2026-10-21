import { describe, it, expect } from 'vitest'
import { groupEventsByDate, formatTime } from './events.js'

describe('groupEventsByDate', () => {
  const dates = ['2026-10-23', '2026-10-24', '2026-10-25']

  it('puts each event under its own day, in weekend order', () => {
    const events = [
      { id: 'a', date: '2026-10-24' },
      { id: 'b', date: '2026-10-23' },
      { id: 'c', date: '2026-10-24' },
    ]

    const groups = groupEventsByDate(events, dates)

    expect(groups.map((group) => group.date)).toEqual(dates)
    expect(groups[0].events.map((e) => e.id)).toEqual(['b'])
    expect(groups[1].events.map((e) => e.id)).toEqual(['a', 'c'])
  })

  it('keeps days with no events, so the page can say so', () => {
    const groups = groupEventsByDate([{ id: 'a', date: '2026-10-23' }], dates)
    expect(groups[2]).toEqual({ date: '2026-10-25', events: [] })
  })

  it('ignores events outside the weekend dates', () => {
    const groups = groupEventsByDate([{ id: 'x', date: '2026-10-30' }], dates)
    expect(groups.every((group) => group.events.length === 0)).toBe(true)
  })
})

describe('formatTime', () => {
  it('shows evening and morning times in 12-hour format', () => {
    expect(formatTime('19:30:00')).toBe('7:30 PM')
    expect(formatTime('08:05:00')).toBe('8:05 AM')
  })

  it('handles midnight and noon', () => {
    expect(formatTime('00:00:00')).toBe('12:00 AM')
    expect(formatTime('12:00:00')).toBe('12:00 PM')
  })

  it('says when the time is not announced yet', () => {
    expect(formatTime(null)).toBe('Time to be announced')
  })
})
