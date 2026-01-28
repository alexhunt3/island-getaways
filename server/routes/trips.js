import { Router } from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getBeachForecast } from '../services/weatherService.js';
import { searchFlights, getFlightSearchUrl, ORIGIN_AIRPORTS } from '../services/flightService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

async function getIslands() {
  const data = await readFile(join(__dirname, '../data/islands.json'), 'utf-8');
  return JSON.parse(data);
}

// GET /api/trips/recommendations - Get top trip recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { origin = 'nyc', departure, return: returnParam } = req.query;
    const islands = await getIslands();

    // Use provided dates or default to next weekend
    let departureDate, returnDate;
    if (departure && returnParam) {
      departureDate = departure;
      returnDate = returnParam;
    } else {
      const weekendDates = getNextWeekendDates();
      departureDate = weekendDates.departureDate;
      returnDate = weekendDates.returnDate;
    }

    // Fetch forecasts for all islands
    const forecastPromises = islands.map(async (island, index) => {
      await new Promise(resolve => setTimeout(resolve, index * 50));
      try {
        const weather = await getBeachForecast(island.lat, island.lon);
        return { ...island, weather };
      } catch (error) {
        return { ...island, weather: null };
      }
    });

    const islandsWithWeather = await Promise.all(forecastPromises);

    // Get top islands for recommendations (good conditions only)
    const topIslands = islandsWithWeather
      .filter(i => i.weather && i.weather.beachScore > 40)
      .sort((a, b) => b.weather.beachScore - a.weather.beachScore)
      .slice(0, 5);

    // Get flight prices for top islands (recommendations)
    const recommendationPromises = topIslands.map(async island => {
      try {
        const flights = await searchFlights(island.nearestAirport, departureDate, returnDate, origin);
        const bestFlight = flights[0];
        return {
          island,
          weather: island.weather,
          flight: bestFlight,
          tripScore: calculateTripScore(island.weather.beachScore, bestFlight?.price),
          dates: { departure: departureDate, return: returnDate }
        };
      } catch (error) {
        return {
          island,
          weather: island.weather,
          flight: null,
          tripScore: island.weather.beachScore,
          dates: { departure: departureDate, return: returnDate }
        };
      }
    });

    const recommendations = await Promise.all(recommendationPromises);
    recommendations.sort((a, b) => b.tripScore - a.tripScore);

    // Build allTrips from ALL islands (for filtering)
    const allTrips = islandsWithWeather
      .filter(i => i.weather)
      .map(island => ({
        island,
        weather: island.weather,
        flight: null,
        tripScore: island.weather.beachScore,
        dates: { departure: departureDate, return: returnDate }
      }))
      .sort((a, b) => b.tripScore - a.tripScore);

    res.json({
      recommendations,
      allTrips,
      dates: { departure: departureDate, return: returnDate },
      origin
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// GET /api/trips/search - Search flights for a specific island
router.get('/search', async (req, res) => {
  try {
    const { islandId, departureDate, returnDate, origin = 'nyc' } = req.query;

    if (!islandId || !departureDate) {
      return res.status(400).json({
        error: 'Missing required parameters: islandId, departureDate'
      });
    }

    const islands = await getIslands();
    const island = islands.find(i => i.id === islandId);

    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }

    const originLabel = ORIGIN_AIRPORTS[origin]?.label.split(' (')[0] || 'New York';

    const [weather, flights] = await Promise.all([
      getBeachForecast(island.lat, island.lon),
      searchFlights(island.nearestAirport, departureDate, returnDate, origin)
    ]);

    res.json({
      island,
      weather,
      flights,
      searchUrl: getFlightSearchUrl(originLabel, island.nearestAirport, departureDate, returnDate),
      dates: { departure: departureDate, return: returnDate },
      origin
    });
  } catch (error) {
    console.error('Error searching trips:', error);
    res.status(500).json({ error: 'Failed to search trips' });
  }
});

function getNextWeekendDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Find next Friday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);

  // Monday is 3 days after Friday
  const monday = new Date(friday);
  monday.setDate(friday.getDate() + 3);

  return {
    departureDate: friday.toISOString().split('T')[0],
    returnDate: monday.toISOString().split('T')[0]
  };
}

function calculateTripScore(beachScore, flightPrice) {
  if (!flightPrice) return beachScore;

  // Normalize flight price (cheaper = better)
  // $300 or less = 100 points, $800+ = 0 points
  const priceScore = Math.max(0, 100 - ((flightPrice - 300) / 5));

  // Weight: 60% beach conditions, 40% flight price
  return Math.round((beachScore * 0.6) + (priceScore * 0.4));
}

export default router;
