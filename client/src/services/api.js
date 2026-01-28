const API_BASE = '/api';

export async function fetchIslands() {
  const response = await fetch(`${API_BASE}/islands`);
  if (!response.ok) throw new Error('Failed to fetch islands');
  return response.json();
}

export async function fetchIslandsWithForecasts() {
  const response = await fetch(`${API_BASE}/islands/forecasts`);
  if (!response.ok) throw new Error('Failed to fetch forecasts');
  return response.json();
}

export async function fetchIslandForecast(islandId) {
  const response = await fetch(`${API_BASE}/islands/${islandId}/forecast`);
  if (!response.ok) throw new Error('Failed to fetch island forecast');
  return response.json();
}

export async function fetchTripRecommendations(origin = 'nyc', departure, returnDate) {
  const params = new URLSearchParams({ origin });
  if (departure) params.append('departure', departure);
  if (returnDate) params.append('return', returnDate);
  const response = await fetch(`${API_BASE}/trips/recommendations?${params}`);
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

export async function searchTrips(islandId, departureDate, returnDate, origin = 'nyc') {
  const params = new URLSearchParams({
    islandId,
    departureDate,
    origin,
    ...(returnDate && { returnDate })
  });
  const response = await fetch(`${API_BASE}/trips/search?${params}`);
  if (!response.ok) throw new Error('Failed to search trips');
  return response.json();
}

export function formatSunshineHours(hours) {
  if (!hours || hours < 1) return '0h';
  return `${Math.round(hours)}h`;
}

export function formatRainChance(percent) {
  if (!percent && percent !== 0) return 'N/A';
  return `${Math.round(percent)}%`;
}

export function formatPrice(price) {
  if (!price) return 'N/A';
  return `$${Math.round(price)}`;
}

export function getBeachRating(score) {
  if (score >= 75) return { label: 'Perfect', class: 'excellent' };
  if (score >= 55) return { label: 'Great', class: 'good' };
  if (score >= 40) return { label: 'Good', class: 'fair' };
  return { label: 'Fair', class: 'poor' };
}

export function formatDate(dateString) {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getDayOfWeek(dateString) {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// UV Index rating
export function getUVRating(uvIndex) {
  if (!uvIndex && uvIndex !== 0) return null;

  if (uvIndex <= 2) {
    return { level: 'Low', class: 'uv-low', advice: 'Minimal protection needed' };
  } else if (uvIndex <= 5) {
    return { level: 'Moderate', class: 'uv-moderate', advice: 'Wear sunscreen' };
  } else if (uvIndex <= 7) {
    return { level: 'High', class: 'uv-high', advice: 'Protection essential' };
  } else if (uvIndex <= 10) {
    return { level: 'Very High', class: 'uv-very-high', advice: 'Extra protection needed' };
  } else {
    return { level: 'Extreme', class: 'uv-extreme', advice: 'Avoid sun exposure' };
  }
}

// Hurricane risk indicator
export function getHurricaneRiskInfo(risk) {
  const riskMap = {
    low: { label: 'Low Risk', class: 'risk-low', description: 'Outside hurricane belt' },
    moderate: { label: 'Moderate Risk', class: 'risk-moderate', description: 'Some hurricane activity possible' },
    high: { label: 'Higher Risk', class: 'risk-high', description: 'In active hurricane zone' }
  };
  return riskMap[risk] || riskMap.moderate;
}

// Get weather condition for beach
export function getBeachCondition(weather) {
  if (!weather?.current) return null;

  const temp = weather.current.temperature;
  const humidity = weather.current.humidity;
  const rainChance = weather.forecast?.avgRainChance || 0;

  if (temp >= 78 && temp <= 88 && humidity < 75 && rainChance < 20) {
    return { condition: 'Paradise', class: 'condition-paradise', description: 'Perfect beach weather' };
  } else if (temp >= 75 && temp <= 90 && rainChance < 40) {
    return { condition: 'Great', class: 'condition-great', description: 'Excellent for the beach' };
  } else if (temp >= 70 && rainChance < 60) {
    return { condition: 'Good', class: 'condition-good', description: 'Good beach conditions' };
  } else {
    return { condition: 'Variable', class: 'condition-variable', description: 'Check daily forecast' };
  }
}
