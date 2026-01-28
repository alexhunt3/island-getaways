import { formatSunshineHours, formatPrice } from '../services/api';

export function CompareModal({ trips, onClose }) {
  if (!trips || trips.length < 2) return null;

  const stats = [
    {
      label: '7-Day Sunshine',
      getValue: (t) => formatSunshineHours(t.weather?.forecast?.totalSunshineHours || 0),
      getBest: (trips) => {
        const max = Math.max(...trips.map(t => t.weather?.forecast?.totalSunshineHours || 0));
        return trips.filter(t => (t.weather?.forecast?.totalSunshineHours || 0) === max).map(t => t.island.id);
      }
    },
    {
      label: 'Beach Score',
      getValue: (t) => t.weather?.beachScore || 0,
      getBest: (trips) => {
        const max = Math.max(...trips.map(t => t.weather?.beachScore || 0));
        return trips.filter(t => (t.weather?.beachScore || 0) === max).map(t => t.island.id);
      }
    },
    {
      label: 'Rain Chance',
      getValue: (t) => `${t.weather?.forecast?.avgRainChance || '--'}%`,
      getBest: (trips) => {
        const min = Math.min(...trips.map(t => t.weather?.forecast?.avgRainChance || 100));
        return trips.filter(t => (t.weather?.forecast?.avgRainChance || 100) === min).map(t => t.island.id);
      }
    },
    {
      label: 'Current Temp',
      getValue: (t) => `${t.weather?.current?.temperature || '--'}°F`,
      getBest: () => []
    },
    {
      label: 'Humidity',
      getValue: (t) => `${t.weather?.current?.humidity || '--'}%`,
      getBest: (trips) => {
        const min = Math.min(...trips.map(t => t.weather?.current?.humidity || 100));
        return trips.filter(t => (t.weather?.current?.humidity || 100) === min).map(t => t.island.id);
      }
    },
    {
      label: 'Flight Price',
      getValue: (t) => formatPrice(t.flight?.price),
      getBest: (trips) => {
        const prices = trips.map(t => t.flight?.price || 9999);
        const min = Math.min(...prices);
        return min < 9999 ? trips.filter(t => (t.flight?.price || 9999) === min).map(t => t.island.id) : [];
      }
    },
    {
      label: 'Avg Temp',
      getValue: (t) => t.island.avgTemp ? `${t.island.avgTemp}°F` : 'N/A',
      getBest: () => []
    },
    {
      label: 'Water Temp',
      getValue: (t) => t.island.waterTemp ? `${t.island.waterTemp}°F` : 'N/A',
      getBest: (trips) => {
        const max = Math.max(...trips.map(t => t.island.waterTemp || 0));
        return trips.filter(t => (t.island.waterTemp || 0) === max).map(t => t.island.id);
      }
    },
    {
      label: 'Sunny Days/Year',
      getValue: (t) => t.island.avgSunnyDays || 'N/A',
      getBest: (trips) => {
        const max = Math.max(...trips.map(t => t.island.avgSunnyDays || 0));
        return max > 0 ? trips.filter(t => (t.island.avgSunnyDays || 0) === max).map(t => t.island.id) : [];
      }
    },
    {
      label: 'Hurricane Risk',
      getValue: (t) => t.island.hurricaneRisk ? t.island.hurricaneRisk.charAt(0).toUpperCase() + t.island.hurricaneRisk.slice(1) : 'N/A',
      getBest: (trips) => {
        const riskOrder = { low: 1, moderate: 2, high: 3 };
        const minRisk = Math.min(...trips.map(t => riskOrder[t.island.hurricaneRisk] || 2));
        return trips.filter(t => (riskOrder[t.island.hurricaneRisk] || 2) === minRisk).map(t => t.island.id);
      }
    },
    {
      label: 'Price Range',
      getValue: (t) => t.island.priceRange === 'budget' ? 'Budget' : t.island.priceRange === 'moderate' ? 'Moderate' : 'Luxury',
      getBest: () => []
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compare Islands</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th></th>
                {trips.map(trip => (
                  <th key={trip.island.id}>
                    <div className="compare-resort-name">{trip.island.name}</div>
                    <div className="compare-resort-location">{trip.island.region}, {trip.island.country}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => {
                const bestIds = stat.getBest(trips);
                return (
                  <tr key={stat.label}>
                    <td className="stat-label">{stat.label}</td>
                    {trips.map(trip => (
                      <td
                        key={trip.island.id}
                        className={bestIds.includes(trip.island.id) ? 'best-value' : ''}
                      >
                        {stat.getValue(trip)}
                        {bestIds.includes(trip.island.id) && <span className="best-badge">Best</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {/* Activities row */}
              {trips.some(t => t.island.activities) && (
                <tr>
                  <td className="stat-label">Activities</td>
                  {trips.map(trip => (
                    <td key={trip.island.id}>
                      {trip.island.activities ? (
                        <div className="activities-mini">
                          {trip.island.activities.snorkeling && <span>Snorkeling</span>}
                          {trip.island.activities.diving && <span>Diving</span>}
                          {trip.island.activities.surfing && <span>Surfing</span>}
                          {trip.island.activities.sailing && <span>Sailing</span>}
                        </div>
                      ) : 'N/A'}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
