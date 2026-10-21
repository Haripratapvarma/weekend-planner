import DayCard from './DayCard.jsx'

// The "Weekend forecast" section: a heading and one card per day.
function WeatherForecast({ forecast }) {
  return (
    <section className="forecast" aria-labelledby="forecast-heading">
      <h2 id="forecast-heading">
        Weekend forecast <span className="forecast-units">({forecast.units.temperature})</span>
      </h2>
      <ul className="forecast-days">
        {forecast.days.map((day) => (
          <DayCard key={day.date} day={day} units={forecast.units} />
        ))}
      </ul>
    </section>
  )
}

export default WeatherForecast
