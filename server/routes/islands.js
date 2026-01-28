import { Router } from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getBeachForecast } from '../services/weatherService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

// Cache for weather data (5 minute TTL)
const weatherCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getIslands() {
  const data = await readFile(join(__dirname, '../data/islands.json'), 'utf-8');
  return JSON.parse(data);
}

// GET /api/islands - List all Caribbean islands
router.get('/', async (req, res) => {
  try {
    const islands = await getIslands();
    res.json(islands);
  } catch (error) {
    console.error('Error fetching islands:', error);
    res.status(500).json({ error: 'Failed to fetch islands' });
  }
});

// GET /api/islands/forecasts - All islands with beach forecasts
router.get('/forecasts', async (req, res) => {
  try {
    const islands = await getIslands();

    // Fetch forecasts in parallel (with rate limiting)
    const forecastPromises = islands.map(async (island, index) => {
      // Stagger requests slightly to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, index * 100));

      const cacheKey = island.id;
      const cached = weatherCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { ...island, weather: cached.data };
      }

      try {
        const weather = await getBeachForecast(island.lat, island.lon);
        weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });
        return { ...island, weather };
      } catch (error) {
        console.error(`Weather fetch failed for ${island.name}:`, error.message);
        return { ...island, weather: null };
      }
    });

    const islandsWithForecasts = await Promise.all(forecastPromises);

    // Sort by beach score (best conditions first)
    islandsWithForecasts.sort((a, b) => {
      const scoreA = a.weather?.beachScore || 0;
      const scoreB = b.weather?.beachScore || 0;
      return scoreB - scoreA;
    });

    res.json(islandsWithForecasts);
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

// GET /api/islands/:id - Single island details
router.get('/:id', async (req, res) => {
  try {
    const islands = await getIslands();
    const island = islands.find(i => i.id === req.params.id);

    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }

    res.json(island);
  } catch (error) {
    console.error('Error fetching island:', error);
    res.status(500).json({ error: 'Failed to fetch island' });
  }
});

// GET /api/islands/:id/forecast - Single island weather forecast
router.get('/:id/forecast', async (req, res) => {
  try {
    const islands = await getIslands();
    const island = islands.find(i => i.id === req.params.id);

    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }

    const cacheKey = island.id;
    const cached = weatherCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ ...island, weather: cached.data });
    }

    const weather = await getBeachForecast(island.lat, island.lon);
    weatherCache.set(cacheKey, { data: weather, timestamp: Date.now() });

    res.json({ ...island, weather });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

export default router;
