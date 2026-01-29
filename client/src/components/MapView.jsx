import { useEffect, useRef, useState } from 'react';
import { formatSunshineHours, getBeachRating } from '../services/api';

export function MapView({ trips, onSelectIsland }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // Create map centered on Caribbean
    const map = L.map(mapRef.current, {
      center: [18, -70],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Add dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded]);

  // Update markers when trips change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Invalidate map size to handle container resize issues
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each island
    trips.forEach(trip => {
      const { island, weather } = trip;
      if (!island.lat || !island.lon) return;

      const beachRating = weather ? getBeachRating(weather.beachScore) : null;

      // Create custom marker icon
      const iconHtml = `
        <div class="map-marker ${beachRating?.class || ''}">
          <div class="marker-score">${weather?.beachScore || '--'}</div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([island.lat, island.lon], { icon })
        .addTo(map);

      // Create popup content
      const popupContent = `
        <div class="map-popup">
          <h3>${island.name}</h3>
          <p class="popup-location">${island.region}, ${island.country}</p>
          <div class="popup-stats">
            <div class="popup-stat">
              <strong>${formatSunshineHours(weather?.forecast?.totalSunshineHours || 0)}</strong>
              <span>7-day sun</span>
            </div>
            <div class="popup-stat">
              <strong>${weather?.beachScore || '--'}</strong>
              <span>Beach Score</span>
            </div>
          </div>
          <button class="popup-btn" onclick="window.selectMapIsland('${island.id}')">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 250
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [trips, mapLoaded]);

  // Handle island selection from popup
  useEffect(() => {
    window.selectMapIsland = (islandId) => {
      const trip = trips.find(t => t.island.id === islandId);
      if (trip) onSelectIsland(trip);
    };

    return () => {
      delete window.selectMapIsland;
    };
  }, [trips, onSelectIsland]);

  if (!mapLoaded) {
    return (
      <div className="map-loading">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      <div className="map-legend">
        <div className="legend-title">Beach Score</div>
        <div className="legend-item"><span className="legend-dot excellent"></span> 75+ Perfect</div>
        <div className="legend-item"><span className="legend-dot good"></span> 55-74 Great</div>
        <div className="legend-item"><span className="legend-dot fair"></span> &lt;55 Good</div>
      </div>
    </div>
  );
}
