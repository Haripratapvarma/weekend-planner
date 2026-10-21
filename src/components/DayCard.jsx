import { describeWeather } from '../lib/weatherCodes.js'
import { formatDay } from '../lib/weekend.js'

// Shows a number, or a dash if the forecast didn't include it.
function show(value, suffix = '') {
  return value === null ? '–' : `${value}${suffix}`
}

// One day's forecast: day name, icon, high/low, rain chance and wind.
function DayCard({ day, units }) {
  const { icon, label } = describeWeather(day.code)
  // formatDay gives "Fri, Oct 23"; split it into "Fri" and "Oct 23".
  const [weekday, monthDay] = formatDay(day.date).split(', ')

  return (
    <li className="day-card">
      <h3 className="day-name">
        {weekday} <span className="day-date">{monthDay}</span>
      </h3>
      <span className="day-icon" aria-hidden="true">
        {icon}
      </span>
      <p className="day-label">{label}</p>
      <p className="day-temps">
        <span className="visually-hidden">High </span>
        <strong>{show(day.high, '°')}</strong>
        <span aria-hidden="true"> / </span>
        <span className="visually-hidden">, low </span>
        {show(day.low, '°')}
      </p>
      <p className="day-extra">
        <span title="Chance of rain">
          <span aria-hidden="true">💧</span>
          <span className="visually-hidden">Chance of rain </span>
          {show(day.rainChance, '%')}
        </span>
        <span title="Top wind speed">
          <span aria-hidden="true">💨</span>
          <span className="visually-hidden">Top wind speed </span>
          {show(day.windMax, ` ${units.wind}`)}
        </span>
      </p>
    </li>
  )
}

export default DayCard
