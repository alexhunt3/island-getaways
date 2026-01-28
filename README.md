# Island Getaways

Find the best Caribbean beach trips based on upcoming weather conditions and flight prices.

## Quick Start

1. Install dependencies:
```bash
npm run install:all
```

2. Start the development servers:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Features

- **30+ Caribbean Destinations** - Islands across the Bahamas, Caribbean, ABC Islands, and Central America
- **7-Day Beach Forecasts** - Sunshine hours, rain chance, and temperature predictions
- **Beach Score** - Smart ranking based on sunshine, low rain probability, comfortable temperatures, and humidity
- **Interactive Map** - View all islands on a map with beach score markers
- **Compare Mode** - Side-by-side comparison of up to 3 islands
- **Flight Search** - Prices from 10 major US cities with date selection
- **Region Filters** - Bahamas, Caribbean, ABC Islands, Mexico & Central America
- **Island Details** - Water temperature, activities, top beaches, hurricane risk, and more

## Beach Score

The Beach Score (0-100) is calculated based on:
- **Sunshine** (35 points) - More sun = better beach day
- **Rain Probability** (30 points) - Lower chance of rain = better
- **Temperature** (20 points) - Ideal range is 78-88°F
- **Wind** (15 points) - Light breezes are perfect for the beach
- **Humidity Penalty** (-10 points) - High humidity reduces comfort

## API Keys (Optional)

For real flight prices, sign up for a free Amadeus developer account:

1. Go to https://developers.amadeus.com/
2. Create an account and get API credentials
3. Create `server/.env`:
```
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
```

Without API keys, the app shows estimated flight prices based on historical route averages.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Weather Data**: Open-Meteo API (free, no key required)
- **Flight Data**: Amadeus API (free test environment)

## Project Structure

```
island-getaways/
├── client/          # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       └── services/     # API client
├── server/          # Express backend
│   ├── data/        # Island database
│   ├── routes/      # API endpoints
│   └── services/    # Weather & flight APIs
└── package.json     # Root scripts
```
