import { formatSunshineHours, formatPrice, getBeachRating } from '../services/api';
import { WeatherIcon } from './WeatherIcon';

export function HeroCard({ trip, isTopPick, onClick }) {
  const { island, weather, flight } = trip;
  const beachRating = weather ? getBeachRating(weather.beachScore) : null;
  const isPerfect = weather?.beachScore > 70;

  // Find best sun day
  const bestSunDay = weather?.forecast.daily.reduce((best, d) =>
    d.sunshineHours > (best?.sunshineHours || 0) ? d : best, null);

  return (
    <div
      className={`hero-card ${isTopPick ? 'top-pick' : ''} ${isPerfect ? 'perfect-weather' : ''}`}
      onClick={() => onClick(trip)}
    >
      <div className="hero-card-header">
        <div>
          <div className="hero-card-title">{island.name}</div>
          <div className="hero-card-location">{island.region}, {island.country}</div>
        </div>
        {beachRating && (
          <span className={`powder-badge ${beachRating.class}`}>
            {weather.beachScore}
          </span>
        )}
      </div>

      {weather && (
        <>
          <div className="hero-card-stats">
            <div className="stat">
              <div className="stat-value">{formatSunshineHours(weather.forecast.totalSunshineHours)}</div>
              <div className="stat-label">7-Day Sun</div>
            </div>
            <div className="stat">
              <div className="stat-value">{weather.forecast.avgRainChance}%</div>
              <div className="stat-label">Rain Chance</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {weather.current.weatherCode !== undefined && (
                  <WeatherIcon code={weather.current.weatherCode} size={24} />
                )}
                {weather.current.temperature}°F
              </div>
              <div className="stat-label">Now</div>
            </div>
          </div>

          <div className="hero-card-forecast">
            {weather.beachScore > 70
              ? `Perfect beach weather - ${formatSunshineHours(weather.forecast.totalSunshineHours)} of sunshine expected!`
              : bestSunDay && bestSunDay.sunshineHours > 6
                ? `Best sun on ${new Date(bestSunDay.date).toLocaleDateString('en-US', { weekday: 'short' })} - ${bestSunDay.sunshineHours}h expected`
                : `Currently ${weather.current.temperature}°F - great for the beach!`
            }
          </div>
        </>
      )}

      {flight && (
        <div className="hero-card-flight">
          <div>
            <div className="flight-price">{formatPrice(flight.price)}</div>
            <div className="flight-details">
              Round trip from {flight.origin}
            </div>
          </div>
          <div className="flight-details">
            {flight.outbound?.stops === 0 ? 'Nonstop' : `${flight.outbound?.stops || 0} stop${(flight.outbound?.stops || 0) > 1 ? 's' : ''}`}
          </div>
        </div>
      )}
    </div>
  );
}
