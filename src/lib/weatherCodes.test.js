import { describe, it, expect } from 'vitest'
import { describeWeather } from './weatherCodes.js'

describe('describeWeather', () => {
  it('describes clear and cloudy skies', () => {
    expect(describeWeather(0)).toEqual({ icon: '☀️', label: 'Clear sky' })
    expect(describeWeather(2)).toEqual({ icon: '⛅', label: 'Partly cloudy' })
    expect(describeWeather(3)).toEqual({ icon: '☁️', label: 'Overcast' })
  })

  it('describes rain, snow and storms', () => {
    expect(describeWeather(63)).toEqual({ icon: '🌧️', label: 'Rain' })
    expect(describeWeather(75)).toEqual({ icon: '❄️', label: 'Heavy snow' })
    expect(describeWeather(95)).toEqual({ icon: '⛈️', label: 'Thunderstorm' })
  })

  it('falls back safely for codes it does not know', () => {
    const fallback = { icon: '🌡️', label: 'Forecast unavailable' }
    expect(describeWeather(12345)).toEqual(fallback)
    expect(describeWeather(null)).toEqual(fallback)
    expect(describeWeather(undefined)).toEqual(fallback)
  })
})
