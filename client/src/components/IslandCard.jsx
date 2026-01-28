import { formatSunshineHours, getBeachRating } from '../services/api';
import { WeatherIcon } from './WeatherIcon';

export function IslandCard({ island, onClick, compareMode, isComparing }) {
  const { weather, flight } = island;
  const beachRating = weather ? getBeachRating(weather.beachScore) : null;
  const isPerfect = weather?.beachScore > 70;

  // Get temperature bar height based on temp (scale 65-95°F)
  const getTempBarHeight = (temp) => {
    if (!temp) return 10;
    const minTemp = 65;
    const maxTemp = 95;
    const pct = ((temp - minTemp) / (maxTemp - minTemp)) * 100;
    return Math.max(10, Math.min(100, pct));
  };

  // Get bar color class based on temperature
  const getTempClass = (temp) => {
    if (temp >= 85) return 'temp-hot';
    if (temp >= 78) return 'temp-warm';
    return 'temp-mild';
  };

  return (
    <div
      className={`resort-card ${isPerfect ? 'perfect-weather' : ''} ${compareMode ? 'compare-mode' : ''} ${isComparing ? 'comparing' : ''}`}
      onClick={() => onClick(island)}
    >
      {/* Compare checkbox */}
      {compareMode && (
        <div className="compare-checkbox">
          <svg viewBox="0 0 24 24" fill={isComparing ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            {isComparing ? (
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            ) : (
              <rect x="3" y="3" width="18" height="18" rx="2" />
            )}
          </svg>
        </div>
      )}

      <div className="resort-card-header">
        <div>
          <div className="resort-name">{island.name}</div>
          <div className="resort-location">{island.region}, {island.country}</div>
        </div>
        {beachRating && (
          <span className={`powder-badge ${beachRating.class}`}>
            {weather.beachScore}
          </span>
        )}
      </div>

      {weather && (
        <>
          <div className="resort-stats">
            <div className="resort-stat">
              <strong>{formatSunshineHours(weather.forecast.totalSunshineHours)}</strong>
              <span>sun</span>
            </div>
            <div className="resort-stat">
              <strong>{weather.forecast.avgRainChance}%</strong>
              <span>rain</span>
            </div>
            <div className="resort-stat">
              {weather.current.weatherCode !== undefined && (
                <WeatherIcon code={weather.current.weatherCode} size={18} />
              )}
              <strong>{weather.current.temperature}°F</strong>
            </div>
          </div>

          <div className="forecast-mini">
            {weather.forecast.daily.slice(0, 7).map((day, i) => {
              const temp = day.tempHigh;
              const barPct = getTempBarHeight(temp);
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
              const tempClass = getTempClass(temp);

              return (
                <div key={i} className="forecast-mini-day">
                  <div
                    className={`forecast-bar temperature ${tempClass}`}
                    style={{
                      height: `${Math.max(12, barPct)}%`
                    }}
                    title={`${dayLabel}: ${temp}°F`}
                  />
                  <span className="forecast-mini-label">{dayLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Flight price if available */}
          {flight?.price && (
            <div className="resort-flight">
              <span className="flight-price-small">${Math.round(flight.price)}</span>
              <span className="flight-label">round trip</span>
            </div>
          )}
        </>
      )}

      {!weather && (
        <div className="resort-stats">
          <div className="resort-stat">Loading forecast...</div>
        </div>
      )}
    </div>
  );
}
