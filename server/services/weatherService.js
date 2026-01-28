// Open-Meteo API integration for beach weather forecasts
// API docs: https://open-meteo.com/en/docs

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

export async function getBeachForecast(lat, lon) {
  // Fetch weather data
  const weatherParams = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,sunshine_duration,uv_index_max,wind_speed_10m_max',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index',
    timezone: 'auto',
    forecast_days: '7'
  });

  const weatherResponse = await fetch(`${OPEN_METEO_BASE}?${weatherParams}`);

  if (!weatherResponse.ok) {
    const text = await weatherResponse.text();
    console.error('Open-Meteo error:', text);
    throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
  }

  const weatherData = await weatherResponse.json();

  // Try to fetch marine data for water temperature (may not be available for all locations)
  let marineData = null;
  try {
    const marineParams = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      daily: 'wave_height_max,wave_period_max',
      current: 'ocean_current_velocity,wave_height',
      timezone: 'auto',
      forecast_days: '7'
    });
    const marineResponse = await fetch(`${MARINE_BASE}?${marineParams}`);
    if (marineResponse.ok) {
      marineData = await marineResponse.json();
    }
  } catch (e) {
    // Marine data not available for this location
  }

  return parseWeatherData(weatherData, marineData);
}

function parseWeatherData(data, marineData) {
  const { current, daily } = data;

  // Calculate beach score
  const beachScore = calculateBeachScore(daily, current);

  // Build daily forecast
  const dailyForecast = daily.time.map((date, i) => ({
    date,
    tempHigh: celsiusToFahrenheit(daily.temperature_2m_max[i]),
    tempLow: celsiusToFahrenheit(daily.temperature_2m_min[i]),
    precipitation: daily.precipitation_sum[i] || 0,
    precipProbability: daily.precipitation_probability_max[i] || 0,
    sunshineHours: Math.round((daily.sunshine_duration[i] || 0) / 3600), // seconds to hours
    uvIndex: daily.uv_index_max[i] || 0,
    windSpeed: Math.round((daily.wind_speed_10m_max[i] || 0) * 0.621371), // km/h to mph
    weatherCode: daily.weather_code[i],
    waveHeight: marineData?.daily?.wave_height_max?.[i]
      ? Math.round(marineData.daily.wave_height_max[i] * 3.281) // meters to feet
      : null
  }));

  // Calculate totals/averages
  const totalSunshineHours = dailyForecast.reduce((sum, d) => sum + d.sunshineHours, 0);
  const avgRainChance = Math.round(
    dailyForecast.reduce((sum, d) => sum + d.precipProbability, 0) / dailyForecast.length
  );

  return {
    current: {
      temperature: celsiusToFahrenheit(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      weatherCode: current.weather_code,
      windSpeed: Math.round((current.wind_speed_10m || 0) * 0.621371), // km/h to mph
      uvIndex: current.uv_index || 0,
      waveHeight: marineData?.current?.wave_height
        ? Math.round(marineData.current.wave_height * 3.281 * 10) / 10
        : null
    },
    forecast: {
      totalSunshineHours,
      avgRainChance,
      daily: dailyForecast
    },
    beachScore,
    updatedAt: new Date().toISOString()
  };
}

function calculateBeachScore(daily, current) {
  let score = 0;

  // Sunshine component (up to 35 points)
  // More sunshine = better beach day
  const totalSunshineHours = daily.sunshine_duration.reduce((sum, val) => sum + (val || 0), 0) / 3600;
  const avgDailySunshine = totalSunshineHours / 7;
  // 10+ hours of sunshine per day is ideal
  score += Math.min(35, (avgDailySunshine / 10) * 35);

  // Rain probability component (up to 30 points)
  // Lower rain chance = better
  const avgRainProb = daily.precipitation_probability_max.reduce((sum, val) => sum + (val || 0), 0) / 7;
  score += Math.max(0, 30 - (avgRainProb * 0.3));

  // Temperature component (up to 20 points)
  // Ideal beach temp is 78-88°F (25-31°C)
  const avgTempC = daily.temperature_2m_max.reduce((a, b) => a + b, 0) / daily.temperature_2m_max.length;
  if (avgTempC >= 25 && avgTempC <= 31) {
    score += 20; // Perfect temp
  } else if (avgTempC >= 22 && avgTempC <= 34) {
    score += 15; // Good temp
  } else if (avgTempC >= 20 && avgTempC <= 36) {
    score += 10; // Acceptable
  } else {
    score += 5; // Not ideal but still okay
  }

  // Humidity penalty (up to -10 points)
  // High humidity makes it feel uncomfortable
  const humidity = current.relative_humidity_2m || 70;
  if (humidity > 85) {
    score -= 10;
  } else if (humidity > 75) {
    score -= 5;
  }

  // Wind component (up to 15 points)
  // Light winds are ideal, strong winds are not great for beach
  const avgWindKmh = daily.wind_speed_10m_max.reduce((sum, val) => sum + (val || 0), 0) / 7;
  if (avgWindKmh < 20) {
    score += 15; // Light breeze - perfect
  } else if (avgWindKmh < 35) {
    score += 10; // Moderate wind
  } else if (avgWindKmh < 50) {
    score += 5; // Windy but manageable
  }
  // Strong winds get no points

  return Math.max(0, Math.min(100, Math.round(score)));
}

function celsiusToFahrenheit(celsius) {
  if (celsius === null || celsius === undefined) return null;
  return Math.round((celsius * 9/5) + 32);
}

export function getWeatherDescription(weatherCode) {
  const descriptions = {
    0: 'Sunny',
    1: 'Mostly sunny',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm'
  };
  return descriptions[weatherCode] || 'Unknown';
}
