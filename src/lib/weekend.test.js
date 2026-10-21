import { describe, it, expect } from 'vitest'
import { getWeekendDates, todayInTimeZone, formatDay } from './weekend.js'

// Reference week (October 2026):
// Mon 19 · Tue 20 · Wed 21 · Thu 22 · Fri 23 · Sat 24 · Sun 25

describe('getWeekendDates', () => {
  it('on a Monday, returns the coming Friday to Sunday', () => {
    expect(getWeekendDates('2026-10-19')).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })

  it('on a Thursday, returns the next day through Sunday', () => {
    expect(getWeekendDates('2026-10-22')).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })

  it('on a Friday, includes today', () => {
    expect(getWeekendDates('2026-10-23')).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
  })

  it('on a Saturday, returns only Saturday and Sunday', () => {
    expect(getWeekendDates('2026-10-24')).toEqual(['2026-10-24', '2026-10-25'])
  })

  it('on a Sunday, returns only Sunday', () => {
    expect(getWeekendDates('2026-10-25')).toEqual(['2026-10-25'])
  })

  it('handles a weekend that runs into the next month', () => {
    // Wednesday, October 28 -> Fri Oct 30, Sat Oct 31, Sun Nov 1
    expect(getWeekendDates('2026-10-28')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })

  it('handles a weekend that runs into the next year', () => {
    // Wednesday, December 30, 2026 -> Fri Jan 1 to Sun Jan 3, 2027
    expect(getWeekendDates('2026-12-30')).toEqual([
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ])
  })
})

describe('todayInTimeZone', () => {
  // 8 PM UTC on Friday, October 23, 2026.
  const moment = new Date('2026-10-23T20:00:00Z')

  it('gives the local date in the city, not on your computer', () => {
    // In Los Angeles it's still Friday afternoon...
    expect(todayInTimeZone('America/Los_Angeles', moment)).toBe('2026-10-23')
    // ...but in Tokyo it's already Saturday morning.
    expect(todayInTimeZone('Asia/Tokyo', moment)).toBe('2026-10-24')
  })

  it('gives a different weekend for each city at the same moment', () => {
    const la = getWeekendDates(todayInTimeZone('America/Los_Angeles', moment))
    const tokyo = getWeekendDates(todayInTimeZone('Asia/Tokyo', moment))

    expect(la).toEqual(['2026-10-23', '2026-10-24', '2026-10-25'])
    expect(tokyo).toEqual(['2026-10-24', '2026-10-25'])
  })
})

describe('formatDay', () => {
  it('turns a date into a short, readable label', () => {
    expect(formatDay('2026-10-23')).toBe('Fri, Oct 23')
    expect(formatDay('2027-01-01')).toBe('Fri, Jan 1')
  })
})
