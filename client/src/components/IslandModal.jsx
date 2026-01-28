import { useState, useEffect, useRef } from 'react';
import { searchTrips, formatSunshineHours, formatPrice, getDayOfWeek, getUVRating, getHurricaneRiskInfo } from '../services/api';
import { WeatherIcon } from './WeatherIcon';

export function IslandModal({ island, weather: initialWeather, flight: initialFlight, onClose, initialDates, originCity, origin = 'nyc' }) {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departureDate, setDepartureDate] = useState(initialDates?.departure || '');
  const [returnDate, setReturnDate] = useState(initialDates?.return || '');
  const returnDateRef = useRef(null);

  useEffect(() => {
    if (island && departureDate) {
      loadTripData();
    }
  }, [island, departureDate, returnDate, origin]);

  async function loadTripData() {
    setLoading(true);
    try {
      const data = await searchTrips(island.id, departureDate, returnDate, origin);
      setTripData(data);
    } catch (err) {
      console.error('Failed to load trip data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle departure date change - auto open return picker and set default return
  const handleDepartureChange = (newDeparture) => {
    const depDate = new Date(newDeparture + 'T12:00:00');
    const retDate = new Date(depDate);
    retDate.setDate(depDate.getDate() + 3); // Default to 3-day trip (Fri-Mon)

    setDepartureDate(newDeparture);
    setReturnDate(retDate.toISOString().split('T')[0]);

    // Auto-open return date picker after a brief delay
    setTimeout(() => {
      if (returnDateRef.current) {
        returnDateRef.current.showPicker?.();
        returnDateRef.current.focus();
      }
    }, 100);
  };

  // Handle return date change - ensure it's after departure
  const handleReturnChange = (newReturn) => {
    if (newReturn < departureDate) {
      const depDate = new Date(departureDate + 'T12:00:00');
      depDate.setDate(depDate.getDate() + 1);
      setReturnDate(depDate.toISOString().split('T')[0]);
    } else {
      setReturnDate(newReturn);
    }
  };

  const weather = tripData?.weather || initialWeather;

  // Get temperature bar height based on temp (scale 65-95°F)
  const getTempBarHeight = (temp) => {
    if (!temp) return 8;
    const minTemp = 65;
    const maxTemp = 95;
    const pct = ((temp - minTemp) / (maxTemp - minTemp)) * 70; // Scale to max 70px
    return Math.max(8, Math.round(pct));
  };

  // Get bar color class based on temperature
  const getTempClass = (temp) => {
    if (temp >= 85) return 'temp-hot';
    if (temp >= 78) return 'temp-warm';
    return 'temp-mild';
  };

  const buildGoogleFlightsUrl = () => {
    const originName = originCity || 'New York';
    const dest = island.nearestAirport;

    if (departureDate && returnDate) {
      const depDate = new Date(departureDate + 'T12:00:00');
      const retDate = new Date(returnDate + 'T12:00:00');
      const depStr = depDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const retStr = retDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(originName)}+to+${dest}+departing+${encodeURIComponent(depStr)}+returning+${encodeURIComponent(retStr)}`;
    } else if (departureDate) {
      const depDate = new Date(departureDate + 'T12:00:00');
      const depStr = depDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(originName)}+to+${dest}+on+${encodeURIComponent(depStr)}`;
    }
    return `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(originName)}+to+${dest}`;
  };

  // Calculate min date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const hurricaneRisk = getHurricaneRiskInfo(island.hurricaneRisk);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{island.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {island.region}, {island.country} · Fly into {island.airportName} ({island.nearestAirport})
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="date-picker">
            <input
              type="date"
              className="date-input"
              value={departureDate}
              min={minDate}
              onChange={e => handleDepartureChange(e.target.value)}
              placeholder="Departure"
            />
            <input
              type="date"
              className="date-input"
              ref={returnDateRef}
              value={returnDate}
              min={departureDate}
              onChange={e => handleReturnChange(e.target.value)}
              placeholder="Return"
            />
          </div>

          {weather && (
            <>
              <h3 style={{ marginBottom: '0.5rem' }}>7-Day Weather Forecast</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {formatSunshineHours(weather.forecast.totalSunshineHours)} total sunshine · {weather.forecast.avgRainChance}% avg rain chance
              </p>

              <div className="forecast-chart">
                {weather.forecast.daily.map((day, i) => {
                  const barHeight = getTempBarHeight(day.tempHigh);
                  const tempClass = getTempClass(day.tempHigh);
                  return (
                    <div key={i} className="forecast-day">
                      <div className="forecast-day-snow">
                        {day.tempHigh}°
                      </div>
                      <div className="forecast-day-bar-container">
                        <div
                          className={`forecast-day-bar temperature ${tempClass}`}
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                      {day.weatherCode !== undefined && (
                        <WeatherIcon code={day.weatherCode} size={20} />
                      )}
                      <div className="forecast-day-label">{getDayOfWeek(day.date)}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div className="stat" style={{ flex: 1, minWidth: '80px' }}>
                  <div className="stat-value">{weather.beachScore}</div>
                  <div className="stat-label">Beach Score</div>
                </div>
                <div className="stat" style={{ flex: 1, minWidth: '80px' }}>
                  <div className="stat-value">{weather.current.temperature}°F</div>
                  <div className="stat-label">Current Temp</div>
                </div>
                <div className="stat" style={{ flex: 1, minWidth: '80px' }}>
                  <div className="stat-value">{weather.current.humidity}%</div>
                  <div className="stat-label">Humidity</div>
                </div>
                <div className="stat" style={{ flex: 1, minWidth: '80px' }}>
                  <div className="stat-value">{weather.current.uvIndex}</div>
                  <div className="stat-label">UV Index</div>
                </div>
              </div>
            </>
          )}

          {/* Island Details */}
          <div className="resort-details">
            <h3>Island Info</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-value">{island.avgTemp}°F</span>
                <span className="detail-label">Avg Temp</span>
              </div>
              <div className="detail-item">
                <span className="detail-value">{island.waterTemp}°F</span>
                <span className="detail-label">Water Temp</span>
              </div>
              <div className="detail-item">
                <span className="detail-value">{island.avgSunnyDays}</span>
                <span className="detail-label">Sunny Days/Year</span>
              </div>
              <div className="detail-item">
                <span className={`detail-value ${hurricaneRisk.class}`}>{hurricaneRisk.label}</span>
                <span className="detail-label">Hurricane Risk</span>
              </div>
            </div>

            {island.activities && (
              <div className="activities-section">
                <div className="terrain-label">Activities</div>
                <div className="activities-grid">
                  {island.activities.snorkeling && (
                    <span className="activity-badge">Snorkeling</span>
                  )}
                  {island.activities.diving && (
                    <span className="activity-badge">Diving</span>
                  )}
                  {island.activities.surfing && (
                    <span className="activity-badge">Surfing</span>
                  )}
                  {island.activities.sailing && (
                    <span className="activity-badge">Sailing</span>
                  )}
                </div>
              </div>
            )}

            {island.beaches && island.beaches.length > 0 && (
              <div className="beaches-section">
                <div className="terrain-label">Top Beaches</div>
                <div className="beaches-list">
                  {island.beaches.map((beach, i) => (
                    <span key={i} className="beach-item">{beach}</span>
                  ))}
                </div>
              </div>
            )}

            {island.bestFor && island.bestFor.length > 0 && (
              <div className="best-for-section">
                <div className="terrain-label">Best For</div>
                <div className="best-for-tags">
                  {island.bestFor.map((tag, i) => (
                    <span key={i} className="best-for-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {island.priceRange && (
              <div className="pass-tier">
                <span className={`pass-badge ${island.priceRange}`}>
                  {island.priceRange === 'budget' ? 'Budget Friendly' :
                   island.priceRange === 'moderate' ? 'Moderate' : 'Luxury'}
                </span>
                {island.rainyMonths && island.rainyMonths.length > 0 && (
                  <span className="season-dates">
                    Rainy months: {island.rainyMonths.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flight-options">
            <h3 style={{ marginBottom: '1rem' }}>Flights from {originCity || 'NYC'}</h3>

            {loading && <p style={{ color: 'var(--text-muted)' }}>Searching flights...</p>}

            {!loading && tripData?.flights?.length > 0 && (
              <>
                {tripData.flights.slice(0, 3).map((flight, i) => (
                  <div key={i} className="flight-option">
                    <div>
                      <div className="flight-option-price">{formatPrice(flight.price)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {flight.carrier} · {flight.origin} → {island.nearestAirport}
                        {flight.outbound?.stops > 0 && ` · ${flight.outbound.stops} stop`}
                      </div>
                    </div>
                    {flight.isMock && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est.</span>
                    )}
                  </div>
                ))}

                <a
                  href={buildGoogleFlightsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="book-btn"
                >
                  Search on Google Flights
                </a>
              </>
            )}

            {!loading && (!tripData?.flights || tripData.flights.length === 0) && (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  No flight data available.
                </p>
                <a
                  href={buildGoogleFlightsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="book-btn"
                >
                  Search on Google Flights
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
