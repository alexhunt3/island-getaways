import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import islandsRouter from './routes/islands.js';
import tripsRouter from './routes/trips.js';
import { initializeAmadeus } from './services/flightService.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize external APIs
initializeAmadeus();

// API Routes
app.use('/api/islands', islandsRouter);
app.use('/api/trips', tripsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production with separate static site, just return API info for root
app.get('/', (req, res) => {
  res.json({
    name: 'Island Getaways API',
    endpoints: ['/api/health', '/api/islands', '/api/islands/forecasts', '/api/trips/recommendations']
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`
Available endpoints:
  GET /api/health              - Health check
  GET /api/islands             - List all Caribbean islands
  GET /api/islands/forecasts   - All islands with beach forecasts
  GET /api/islands/:id         - Single island details
  GET /api/islands/:id/forecast - Island weather forecast
  GET /api/trips/recommendations - Top trip recommendations
  GET /api/trips/search        - Search flights for an island
  `);
});
