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

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));

  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(clientBuildPath, 'index.html'));
  });
}

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
