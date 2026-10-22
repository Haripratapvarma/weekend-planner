import { describe, it, expect } from 'vitest'
import { classifyEvent } from './classify.js'

// A small helper to build an event like the ones /api/events returns.
function event({ name = 'Some Event', venue = 'Some Venue', segment = '', genre = '' } = {}) {
  return { name, venue: { name: venue }, segment, genre }
}

const settingOf = (details) => classifyEvent(event(details)).setting

describe('classifyEvent', () => {
  it('spots outdoor venues by name (real venue names)', () => {
    expect(settingOf({ venue: 'Red Rocks Amphitheatre' })).toBe('outdoor')
    expect(settingOf({ venue: "Stubb's Waller Creek Amphitheater" })).toBe('outdoor')
    expect(settingOf({ venue: 'Hollywood Bowl' })).toBe('outdoor')
    expect(settingOf({ venue: 'Soldier Field' })).toBe('outdoor')
    expect(settingOf({ venue: "Buck's Backyard" })).toBe('outdoor')
    expect(settingOf({ venue: 'Zilker Park' })).toBe('outdoor')
  })

  it('lets indoor clues win over outdoor ones', () => {
    // These venues have outdoor stages too, but these are the indoor rooms.
    expect(settingOf({ venue: "Stubb's Indoors" })).toBe('indoor')
    expect(settingOf({ venue: 'The Salt Shed Indoors (Shed)' })).toBe('indoor')
    // "Beach" is in the name, but it's an arena.
    expect(settingOf({ venue: 'Long Beach Arena-Long Beach Convention Center' })).toBe('indoor')
    // "Cedar Park" is the town's name; the venue is an indoor arena.
    expect(settingOf({ venue: 'H-E-B Center at Cedar Park', genre: 'Basketball' })).toBe('indoor')
    // A domed stadium, even for football.
    expect(settingOf({ venue: 'Intuit Dome', genre: 'Football' })).toBe('indoor')
  })

  it('knows big stadiums that have a roof', () => {
    expect(settingOf({ venue: 'SoFi Stadium', genre: 'Football' })).toBe('indoor')
  })

  it('matches whole words only ("theater" inside "amphitheater" does not count)', () => {
    expect(settingOf({ venue: 'Ascend Amphitheater' })).toBe('outdoor')
    expect(settingOf({ venue: 'Park Theater' })).toBe('indoor')
  })

  it('uses the event name for festivals and outdoor events', () => {
    expect(settingOf({ name: 'Austin City Limits Music Festival', venue: 'Downtown' })).toBe('outdoor')
    expect(settingOf({ name: 'Open-Air Cinema Night', venue: 'Town Square' })).toBe('outdoor')
  })

  it('uses the sport when the venue name gives no clue', () => {
    expect(settingOf({ name: 'USGP', venue: 'Circuit of The Americas', genre: 'Motorsports/Racing' })).toBe('outdoor')
    expect(settingOf({ venue: 'Q2 Something', genre: 'Soccer' })).toBe('outdoor')
    expect(settingOf({ venue: 'United Center', genre: 'Hockey' })).toBe('indoor')
  })

  it('assumes indoors when there are no outdoor clues', () => {
    expect(settingOf({ venue: 'Madison Square Garden', genre: 'Basketball' })).toBe('indoor')
    expect(settingOf({ venue: 'Prince Edward Theatre' })).toBe('indoor')
    expect(classifyEvent({}).setting).toBe('indoor') // even with missing details
  })

  it('explains its guess', () => {
    expect(classifyEvent(event({ venue: 'Red Rocks Amphitheatre' })).reason).toBe(
      'The venue name mentions "amphitheatre"',
    )
  })
})
