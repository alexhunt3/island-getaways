// Amadeus API integration for flight search
// Sign up at: https://developers.amadeus.com/

import Amadeus from 'amadeus';

let amadeus = null;

// Origin airport configurations
export const ORIGIN_AIRPORTS = {
  nyc: { label: 'New York (NYC)', airports: ['JFK', 'LGA', 'EWR'] },
  dca: { label: 'Washington DC (DCA)', airports: ['DCA', 'IAD', 'BWI'] },
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

export function initializeAmadeus() {
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
      hostname: 'test' // Use 'production' for live data
    });
    console.log('Amadeus API initialized');
    return true;
  }
  console.warn('Amadeus API credentials not found - flight search will use mock data');
  return false;
}

function getOriginAirports(origin) {
  return ORIGIN_AIRPORTS[origin]?.airports || ORIGIN_AIRPORTS.nyc.airports;
}

export async function searchFlights(destinationAirport, departureDate, returnDate, origin = 'nyc') {
  const originAirports = getOriginAirports(origin);

  // If Amadeus not configured, return mock data
  if (!amadeus) {
    return getMockFlights(destinationAirport, departureDate, returnDate, originAirports, origin);
  }

  try {
    // Search from all origin airports and find the best deal
    const searchPromises = originAirports.map(originAirport =>
      searchFromAirport(originAirport, destinationAirport, departureDate, returnDate)
    );

    const results = await Promise.allSettled(searchPromises);
    const flights = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => r.value);

    if (flights.length === 0) {
      return getMockFlights(destinationAirport, departureDate, returnDate, originAirports, origin);
    }

    // Sort by price and return top options
    return flights.sort((a, b) => a.price - b.price).slice(0, 5);
  } catch (error) {
    console.error('Flight search error:', error.message);
    return getMockFlights(destinationAirport, departureDate, returnDate, originAirports, origin);
  }
}

async function searchFromAirport(origin, destination, departureDate, returnDate) {
  try {
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: '1',
      currencyCode: 'USD',
      max: '3'
    };

    if (returnDate) {
      searchParams.returnDate = returnDate;
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

    return response.data.map(offer => parseFlightOffer(offer, origin));
  } catch (error) {
    // Specific route may not have flights
    console.log(`No flights from ${origin} to ${destination}: ${error.message}`);
    return [];
  }
}

function parseFlightOffer(offer, origin) {
  const outbound = offer.itineraries[0];
  const returnFlight = offer.itineraries[1];

  return {
    id: offer.id,
    origin,
    price: parseFloat(offer.price.total),
    currency: offer.price.currency,
    outbound: {
      departure: outbound.segments[0].departure.at,
      arrival: outbound.segments[outbound.segments.length - 1].arrival.at,
      duration: outbound.duration,
      stops: outbound.segments.length - 1,
      carrier: outbound.segments[0].carrierCode
    },
    return: returnFlight ? {
      departure: returnFlight.segments[0].departure.at,
      arrival: returnFlight.segments[returnFlight.segments.length - 1].arrival.at,
      duration: returnFlight.duration,
      stops: returnFlight.segments.length - 1,
      carrier: returnFlight.segments[0].carrierCode
    } : null,
    bookingUrl: `https://www.google.com/flights?q=flights+from+${origin}+to+${offer.itineraries[0].segments[0].arrival.iataCode}`
  };
}

function getMockFlights(destination, departureDate, returnDate, originAirports, originKey) {
  // Generate realistic mock flight data
  const basePrice = getBasePrice(destination, originKey);

  return originAirports.map((origin, index) => ({
    id: `mock-${origin}-${destination}-${Date.now()}`,
    origin,
    price: basePrice + (index * 25) + Math.floor(Math.random() * 50),
    currency: 'USD',
    outbound: {
      departure: `${departureDate}T08:00:00`,
      arrival: `${departureDate}T12:00:00`,
      duration: 'PT4H',
      stops: Math.random() > 0.5 ? 1 : 0,
      carrier: ['UA', 'AA', 'DL', 'WN'][index % 4]
    },
    return: returnDate ? {
      departure: `${returnDate}T15:00:00`,
      arrival: `${returnDate}T23:00:00`,
      duration: 'PT4H30M',
      stops: Math.random() > 0.5 ? 1 : 0,
      carrier: ['UA', 'AA', 'DL', 'WN'][index % 4]
    } : null,
    isMock: true,
    bookingUrl: `https://www.google.com/flights?q=flights+from+${origin}+to+${destination}`
  })).sort((a, b) => a.price - b.price);
}

function getBasePrice(destination, originKey = 'nyc') {
  // Base prices from NYC
  const nycPrices = {
    // Colorado
    'DEN': 180, 'ASE': 350, 'HDN': 320,
    // Utah
    'SLC': 200,
    // California
    'RNO': 220, 'MMH': 380, 'ONT': 200,
    // Montana/Wyoming
    'BZN': 280, 'JAC': 350,
    // Northeast (cheap!)
    'BTV': 120, 'ALB': 80, 'PWM': 150, 'MHT': 100,
    // Canada
    'YUL': 150, 'YYZ': 180, 'YVR': 300, 'YLW': 350, 'YXS': 380,
    // Europe
    'GVA': 450, 'INN': 500,
    // Japan
    'CTS': 800,
    // Other
    'ABQ': 200, 'SEA': 250, 'TVC': 220, 'CKB': 250
  };

  const basePrice = nycPrices[destination] || 250;

  // Adjust prices based on origin city
  const adjustments = {
    nyc: 0,
    dca: 10, // DC prices similar to NYC, slightly higher
    lax: destination.startsWith('Y') ? 100 : (destination === 'MMH' || destination === 'RNO') ? -100 : 20,
    chi: destination === 'DEN' ? -30 : destination.startsWith('Y') ? -50 : 10,
    dfw: destination === 'DEN' ? -50 : destination === 'ABQ' ? -80 : 30,
    mia: destination.startsWith('Y') ? 150 : 80,
    sfo: (destination === 'MMH' || destination === 'RNO' || destination === 'SLC') ? -80 : 40,
    bos: (destination === 'BTV' || destination === 'PWM' || destination === 'MHT') ? -50 : 20,
    sea: destination === 'SEA' ? 0 : (destination === 'RNO' || destination === 'SLC') ? -40 : 60,
    den: destination === 'DEN' ? 0 : destination === 'SLC' ? -80 : (destination === 'ASE' || destination === 'HDN') ? -150 : 50,
    atl: destination === 'DEN' ? -20 : 40
  };

  return Math.max(80, basePrice + (adjustments[originKey] || 0));
}

export function getFlightSearchUrl(origin, destination, departureDate, returnDate) {
  const baseUrl = 'https://www.google.com/travel/flights';
  const params = new URLSearchParams({
    q: `flights from ${origin} to ${destination}`,
    d: departureDate,
    r: returnDate || ''
  });
  return `${baseUrl}?${params}`;
}
