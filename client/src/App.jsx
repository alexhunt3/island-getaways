import { useState, useMemo, useEffect, useRef } from 'react';
import { useRecommendations } from './hooks/useRecommendations';
import { HeroCard } from './components/HeroCard';
import { IslandCard } from './components/IslandCard';
import { IslandModal } from './components/IslandModal';
import { LoadingScreen } from './components/LoadingScreen';
import { CompareModal } from './components/CompareModal';
import { MapView } from './components/MapView';

const ORIGIN_AIRPORTS = {
  nyc: { label: 'New York (NYC)', airports: ['JFK', 'LGA', 'EWR'] },
  lax: { label: 'Los Angeles (LAX)', airports: ['LAX', 'BUR', 'SNA'] },
  chi: { label: 'Chicago (ORD)', airports: ['ORD', 'MDW'] },
  dfw: { label: 'Dallas (DFW)', airports: ['DFW', 'DAL'] },
  mia: { label: 'Miami (MIA)', airports: ['MIA', 'FLL'] },
  sfo: { label: 'San Francisco (SFO)', airports: ['SFO', 'OAK', 'SJC'] },
  bos: { label: 'Boston (BOS)', airports: ['BOS'] },
  sea: { label: 'Seattle (SEA)', airports: ['SEA'] },
  den: { label: 'Denver (DEN)', airports: ['DEN'] },
  atl: { label: 'Atlanta (ATL)', airports: ['ATL'] }
};

const REGIONS = {
  all: 'All Islands',
  bahamas: 'Bahamas',
  caribbean: 'Caribbean',
  mexico: 'Mexico & Central America',
  abc: 'ABC Islands'
};

function getRegion(island) {
  if (island.region === 'Bahamas' || island.region === 'Lucayan Archipelago') return 'bahamas';
  if (island.region === 'ABC Islands') return 'abc';
  if (island.region === 'Mexico' || island.region === 'Central America' || island.region === 'Bay Islands') return 'mexico';
  return 'caribbean'; // Lesser Antilles, Greater Antilles, Virgin Islands, etc.
}

const SORT_OPTIONS = {
  beach: 'Best Beach Weather',
  sunshine: 'Most Sunshine',
  name: 'Name (A-Z)'
};

const BEST_FOR_OPTIONS = {
  all: 'All Activities',
  beaches: 'Beaches',
  families: 'Families',
  romance: 'Romance',
  nightlife: 'Nightlife',
  diving: 'Diving',
  surfing: 'Surfing',
  adventure: 'Adventure',
  nature: 'Nature',
  budget: 'Budget'
};

const VIEW_MODES = {
  grid: 'Grid',
  map: 'Map'
};

export default function App() {
  // Core state
  const [origin, setOrigin] = useState(() => {
    const saved = localStorage.getItem('selectedOrigin');
    return saved || 'nyc';
  });

  // Trip date selector - must be before useRecommendations hook
  const returnDateRef = useRef(null);
  const FORECAST_DAYS = 7; // Weather forecasts are typically 7 days out

  const [tripDates, setTripDates] = useState(() => {
    // Default to next weekend (Friday - Monday)
    const today = new Date();
    const friday = new Date(today);
    friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7));
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    return {
      departure: friday.toISOString().split('T')[0],
      return: monday.toISOString().split('T')[0]
    };
  });

  const { data, loading, error, refetch } = useRecommendations(origin, tripDates);
  const [selectedIsland, setSelectedIsland] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('beach');
  const [viewMode, setViewMode] = useState('grid');

  // Calculate forecast date range
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  const maxForecastDate = new Date(today);
  maxForecastDate.setDate(today.getDate() + FORECAST_DAYS);
  const maxDate = maxForecastDate.toISOString().split('T')[0];

  // Check if selected dates are within forecast range
  const isDepartureInForecast = tripDates.departure <= maxDate;
  const isReturnInForecast = tripDates.return <= maxDate;
  const datesOutsideForecast = !isDepartureInForecast || !isReturnInForecast;

  // Handle departure date change - auto open return picker and set default return
  const handleDepartureChange = (newDeparture) => {
    const depDate = new Date(newDeparture + 'T12:00:00');
    const retDate = new Date(depDate);
    retDate.setDate(depDate.getDate() + 3); // Default to 3-day trip (Fri-Mon)

    setTripDates({
      departure: newDeparture,
      return: retDate.toISOString().split('T')[0]
    });

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
    if (newReturn < tripDates.departure) {
      // If return is before departure, set return to departure + 1
      const depDate = new Date(tripDates.departure + 'T12:00:00');
      depDate.setDate(depDate.getDate() + 1);
      setTripDates(prev => ({ ...prev, return: depDate.toISOString().split('T')[0] }));
    } else {
      setTripDates(prev => ({ ...prev, return: newReturn }));
    }
  };

  // Advanced filters
  const [filters, setFilters] = useState({
    minSunshine: 0,
    minBeachScore: 0,
    hurricaneRisk: 'all', // 'all', 'low', 'moderate', 'high'
    bestFor: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Sync origin to localStorage and refetch data
  useEffect(() => {
    localStorage.setItem('selectedOrigin', origin);
  }, [origin]);

  const handleOriginChange = (newOrigin) => {
    setOrigin(newOrigin);
    refetch(newOrigin, tripDates);
  };

  const toggleCompare = (trip) => {
    setCompareList(prev => {
      const exists = prev.find(t => t.island.id === trip.island.id);
      if (exists) {
        return prev.filter(t => t.island.id !== trip.island.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), trip]; // Replace oldest
      }
      return [...prev, trip];
    });
  };

  const filteredAndSortedTrips = useMemo(() => {
    if (!data?.allTrips) return [];

    let trips = [...data.allTrips];

    // Filter by region
    if (regionFilter !== 'all') {
      trips = trips.filter(t => getRegion(t.island) === regionFilter);
    }

    // Apply advanced filters
    trips = trips.filter(t => {
      const sunshine = t.weather?.forecast?.totalSunshineHours || 0;
      const beachScore = t.weather?.beachScore || 0;
      const hurricaneRisk = t.island.hurricaneRisk || 'moderate';
      const bestForList = t.island.bestFor || [];

      if (sunshine < filters.minSunshine) return false;
      if (beachScore < filters.minBeachScore) return false;
      if (filters.hurricaneRisk !== 'all' && hurricaneRisk !== filters.hurricaneRisk) return false;
      if (filters.bestFor !== 'all' && !bestForList.includes(filters.bestFor)) return false;

      return true;
    });

    // Sort
    switch (sortBy) {
      case 'sunshine':
        trips.sort((a, b) =>
          (b.weather?.forecast?.totalSunshineHours || 0) - (a.weather?.forecast?.totalSunshineHours || 0)
        );
        break;
      case 'name':
        trips.sort((a, b) => a.island.name.localeCompare(b.island.name));
        break;
      case 'beach':
      default:
        trips.sort((a, b) => (b.weather?.beachScore || 0) - (a.weather?.beachScore || 0));
    }

    return trips;
  }, [data, regionFilter, sortBy, filters]);

  const topPicks = data?.recommendations?.slice(0, 3) || [];
  const originLabel = ORIGIN_AIRPORTS[origin]?.label.split(' (')[0] || 'New York';

  const activeFiltersCount = [
    filters.minSunshine > 0,
    filters.minBeachScore > 0,
    filters.hurricaneRisk !== 'all',
    filters.bestFor !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="app">
      <header className="header">
        <h1>Island Getaways</h1>
        <p>Find the best beach weather and affordable flights</p>

        <div className="header-controls">
          <div className="origin-selector">
            <label htmlFor="origin-select">From:</label>
            <select
              id="origin-select"
              className="origin-select"
              value={origin}
              onChange={e => handleOriginChange(e.target.value)}
            >
              {Object.entries(ORIGIN_AIRPORTS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="date-selector">
            <label>Trip Dates:</label>
            <input
              type="date"
              className="date-input-small"
              value={tripDates.departure}
              min={minDate}
              onChange={e => handleDepartureChange(e.target.value)}
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              className="date-input-small"
              ref={returnDateRef}
              value={tripDates.return}
              min={tripDates.departure}
              onChange={e => handleReturnChange(e.target.value)}
            />
            {datesOutsideForecast && (
              <span className="forecast-warning" title="Weather forecasts are only available for the next 7 days">
                ⚠️
              </span>
            )}
          </div>
        </div>
      </header>

      {loading && <LoadingScreen />}

      {error && (
        <div className="error">
          <p>Failed to load data: {error}</p>
          <p>Make sure the server is running on port 3001</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Top Recommendations */}
          <section className="hero-section">
            <h2>
              Top Getaways for {tripDates.departure
                ? new Date(tripDates.departure + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'This Weekend'
              }
              {tripDates.return && ` - ${new Date(tripDates.return + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </h2>
            <div className="hero-cards">
              {topPicks.map((trip, i) => (
                <HeroCard
                  key={trip.island.id}
                  trip={trip}
                  isTopPick={i === 0}
                  onClick={() => setSelectedIsland(trip)}
                />
              ))}
            </div>
          </section>

          {/* All Islands */}
          <section className="resorts-section">
            <div className="section-header">
              <h2>All Caribbean Islands</h2>
              <div className="view-toggle">
                {Object.entries(VIEW_MODES).map(([key, label]) => (
                  <button
                    key={key}
                    className={`view-btn ${viewMode === key ? 'active' : ''}`}
                    onClick={() => setViewMode(key)}
                  >
                    {key === 'grid' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="10" r="3" />
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters-row">
              <div className="filters">
                {Object.entries(REGIONS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`filter-btn ${regionFilter === key ? 'active' : ''}`}
                    onClick={() => setRegionFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="filters-right">
                <button
                  className={`filter-btn ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>

                <button
                  className={`filter-btn compare-btn ${compareMode ? 'active' : ''}`}
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (compareMode) setCompareList([]);
                  }}
                >
                  {compareMode ? `Compare (${compareList.length})` : 'Compare'}
                </button>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="advanced-filters">
                <div className="filter-group">
                  <label>Min Sunshine Hours (7-day)</label>
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="5"
                    value={filters.minSunshine}
                    onChange={e => setFilters(prev => ({ ...prev, minSunshine: Number(e.target.value) }))}
                  />
                  <span>{filters.minSunshine}h+ </span>
                </div>

                <div className="filter-group">
                  <label>Min Beach Score</label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="10"
                    value={filters.minBeachScore}
                    onChange={e => setFilters(prev => ({ ...prev, minBeachScore: Number(e.target.value) }))}
                  />
                  <span>{filters.minBeachScore}+</span>
                </div>

                <div className="filter-group">
                  <label>Hurricane Risk</label>
                  <select
                    value={filters.hurricaneRisk}
                    onChange={e => setFilters(prev => ({ ...prev, hurricaneRisk: e.target.value }))}
                  >
                    <option value="all">Any Risk Level</option>
                    <option value="low">Low Risk Only</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Best For</label>
                  <select
                    value={filters.bestFor}
                    onChange={e => setFilters(prev => ({ ...prev, bestFor: e.target.value }))}
                  >
                    {Object.entries(BEST_FOR_OPTIONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="filter-reset"
                  onClick={() => setFilters({ minSunshine: 0, minBeachScore: 0, hurricaneRisk: 'all', bestFor: 'all' })}
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Compare Bar */}
            {compareMode && compareList.length > 0 && (
              <div className="compare-bar">
                <div className="compare-items">
                  {compareList.map(trip => (
                    <div key={trip.island.id} className="compare-item">
                      <span>{trip.island.name}</span>
                      <button onClick={() => toggleCompare(trip)}>&times;</button>
                    </div>
                  ))}
                </div>
                <button
                  className="compare-action"
                  onClick={() => setShowCompareModal(true)}
                  disabled={compareList.length < 2}
                >
                  Compare {compareList.length} Islands
                </button>
              </div>
            )}

            {/* View Mode Content */}
            {viewMode === 'grid' ? (
              <div className="resort-grid">
                {filteredAndSortedTrips.map(trip => (
                  <IslandCard
                    key={trip.island.id}
                    island={{ ...trip.island, weather: trip.weather, flight: trip.flight }}
                    onClick={() => compareMode ? toggleCompare(trip) : setSelectedIsland(trip)}
                    compareMode={compareMode}
                    isComparing={compareList.some(t => t.island.id === trip.island.id)}
                  />
                ))}
              </div>
            ) : (
              <MapView
                trips={filteredAndSortedTrips}
                onSelectIsland={(trip) => setSelectedIsland(trip)}
              />
            )}

            {filteredAndSortedTrips.length === 0 && (
              <div className="empty-state">
                <p>No islands match your filters. Try adjusting your criteria.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* Island Detail Modal */}
      {selectedIsland && (
        <IslandModal
          island={selectedIsland.island}
          weather={selectedIsland.weather}
          flight={selectedIsland.flight}
          onClose={() => setSelectedIsland(null)}
          initialDates={tripDates}
          originCity={originLabel}
          origin={origin}
        />
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          trips={compareList}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}
