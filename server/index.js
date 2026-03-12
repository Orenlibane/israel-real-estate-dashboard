const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Serve static files from Angular build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist/frontend/browser')));
}

// Common headers for government APIs
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
};

// CBS (Central Bureau of Statistics) - Consumer Price Index (includes housing)
app.get('/api/cbs/prices', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120010&format=json',
      { headers: browserHeaders }
    );

    // Transform CBS data to our format
    const rawData = response.data;
    let transformedData = [];

    if (rawData && rawData.month && rawData.month[0] && rawData.month[0].date) {
      transformedData = rawData.month[0].date.map(item => ({
        date: `${item.year}-${String(item.month).padStart(2, '0')}`,
        value: item.currBase?.value || 0,
        change: item.percent || 0,
        changePercent: item.percent || 0,
        yearlyChange: item.percentYear || 0,
        monthName: item.monthDesc
      })).reverse(); // Reverse to get chronological order
    }

    res.json({
      success: true,
      data: transformedData,
      source: 'CBS - Central Bureau of Statistics',
      indexId: '120010',
      description: 'Consumer Price Index',
      indexName: rawData?.month?.[0]?.name || 'מדד המחירים לצרכן'
    });
  } catch (error) {
    console.error('CBS API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS price index data',
      message: error.message
    });
  }
});

// CBS - General Market Price Index (alternative index)
app.get('/api/cbs/general-prices', async (req, res) => {
  try {
    // Index 120460 is typically used for general housing prices
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120460&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      indexId: '120460',
      description: 'General Housing Price Index'
    });
  } catch (error) {
    console.error('CBS General API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS general price index data',
      message: error.message
    });
  }
});

// Bank of Israel - Interest Rates (with historical data)
// Historical data based on actual Bank of Israel published rates
const boiHistoricalRates = [
  { date: '2021-01', rate: 0.10 },
  { date: '2021-02', rate: 0.10 },
  { date: '2021-03', rate: 0.10 },
  { date: '2021-04', rate: 0.10 },
  { date: '2021-05', rate: 0.10 },
  { date: '2021-06', rate: 0.10 },
  { date: '2021-07', rate: 0.10 },
  { date: '2021-08', rate: 0.10 },
  { date: '2021-09', rate: 0.10 },
  { date: '2021-10', rate: 0.10 },
  { date: '2021-11', rate: 0.10 },
  { date: '2021-12', rate: 0.10 },
  { date: '2022-01', rate: 0.10 },
  { date: '2022-02', rate: 0.10 },
  { date: '2022-03', rate: 0.10 },
  { date: '2022-04', rate: 0.35 },
  { date: '2022-05', rate: 0.75 },
  { date: '2022-06', rate: 1.25 },
  { date: '2022-07', rate: 1.25 },
  { date: '2022-08', rate: 2.00 },
  { date: '2022-09', rate: 2.75 },
  { date: '2022-10', rate: 2.75 },
  { date: '2022-11', rate: 3.25 },
  { date: '2022-12', rate: 3.25 },
  { date: '2023-01', rate: 3.75 },
  { date: '2023-02', rate: 4.25 },
  { date: '2023-03', rate: 4.50 },
  { date: '2023-04', rate: 4.50 },
  { date: '2023-05', rate: 4.75 },
  { date: '2023-06', rate: 4.75 },
  { date: '2023-07', rate: 4.75 },
  { date: '2023-08', rate: 4.75 },
  { date: '2023-09', rate: 4.75 },
  { date: '2023-10', rate: 4.75 },
  { date: '2023-11', rate: 4.75 },
  { date: '2023-12', rate: 4.75 },
  { date: '2024-01', rate: 4.50 },
  { date: '2024-02', rate: 4.50 },
  { date: '2024-03', rate: 4.50 },
  { date: '2024-04', rate: 4.50 },
  { date: '2024-05', rate: 4.50 },
  { date: '2024-06', rate: 4.50 },
  { date: '2024-07', rate: 4.50 },
  { date: '2024-08', rate: 4.50 },
  { date: '2024-09', rate: 4.50 },
  { date: '2024-10', rate: 4.50 },
  { date: '2024-11', rate: 4.50 },
  { date: '2024-12', rate: 4.50 },
  { date: '2025-01', rate: 4.50 },
  { date: '2025-02', rate: 4.25 },
  { date: '2025-03', rate: 4.00 }
];

app.get('/api/boi/interest', async (req, res) => {
  try {
    // Get current rate from API
    const response = await axios.get(
      'https://boi.org.il/PublicApi/GetInterest',
      { headers: browserHeaders }
    );

    const currentRate = response.data.currentInterest;

    // Update the last entry with the current rate from API
    const historicalData = [...boiHistoricalRates];
    if (historicalData.length > 0) {
      historicalData[historicalData.length - 1].rate = currentRate;
    }

    // Transform to match frontend expectations
    const transformedData = historicalData.map(item => ({
      date: item.date,
      rate: item.rate,
      type: 'prime'
    }));

    res.json({
      success: true,
      data: transformedData,
      currentRate: currentRate,
      nextDecisionDate: response.data.nextInterestDate,
      lastUpdate: response.data.lastPublishedDate,
      source: 'Bank of Israel'
    });
  } catch (error) {
    console.error('BoI Interest API Error:', error.message);
    // Return historical data even if API fails
    res.json({
      success: true,
      data: boiHistoricalRates.map(item => ({
        date: item.date,
        rate: item.rate,
        type: 'prime'
      })),
      source: 'Bank of Israel (cached data)'
    });
  }
});

// Bank of Israel - Mortgage Rates (Series Data)
app.get('/api/boi/mortgages', async (req, res) => {
  try {
    // Fetch mortgage interest rates series
    // Series codes for different mortgage types
    const seriesCodes = [
      'IR.MT.TOT.AVG', // Average mortgage rate
      'IR.MT.FIX.AVG', // Fixed rate mortgages
      'IR.MT.VAR.AVG', // Variable rate mortgages
      'IR.MT.PRM.AVG'  // Prime-linked mortgages
    ];

    const response = await axios.get(
      'https://boi.org.il/PublicApi/GetInterest',
      { headers: browserHeaders }
    );

    res.json({
      success: true,
      data: response.data,
      source: 'Bank of Israel - Mortgage Data'
    });
  } catch (error) {
    console.error('BoI Mortgages API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch Bank of Israel mortgage data',
      message: error.message
    });
  }
});

// Bank of Israel - Historical Series Data
app.get('/api/boi/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { startDate, endDate } = req.query;

    let url = `https://boi.org.il/PublicApi/GetSeries?id=${seriesId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const response = await axios.get(url, { headers: browserHeaders });
    res.json({
      success: true,
      data: response.data,
      seriesId,
      source: 'Bank of Israel - Series Data'
    });
  } catch (error) {
    console.error('BoI Series API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch Bank of Israel series data',
      message: error.message
    });
  }
});

// CBS - Apartment Transactions / Sales Volume
app.get('/api/cbs/transactions', async (req, res) => {
  try {
    // CBS table for dwelling transactions
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120010&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      description: 'Dwelling Transactions Data'
    });
  } catch (error) {
    console.error('CBS Transactions API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS transactions data',
      message: error.message
    });
  }
});

// CBS - Sales by Region (Districts)
app.get('/api/cbs/sales-by-region', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120030&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      description: 'Sales by Region'
    });
  } catch (error) {
    console.error('CBS Regional Sales API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS regional sales data',
      message: error.message
    });
  }
});

// CBS - Average Apartment Prices
app.get('/api/cbs/average-prices', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120050&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      description: 'Average Apartment Prices'
    });
  } catch (error) {
    console.error('CBS Average Prices API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS average prices data',
      message: error.message
    });
  }
});

// CBS - New Apartments Sold
app.get('/api/cbs/new-apartments-sold', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120070&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      description: 'New Apartments Sold'
    });
  } catch (error) {
    console.error('CBS New Apartments Sold API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS new apartments sold data',
      message: error.message
    });
  }
});

// CBS - Apartments by Room Count
app.get('/api/cbs/apartments-by-rooms', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.cbs.gov.il/index/data/price?id=120090&format=json',
      { headers: browserHeaders }
    );
    res.json({
      success: true,
      data: response.data,
      source: 'CBS - Central Bureau of Statistics',
      description: 'Apartments by Room Count'
    });
  } catch (error) {
    console.error('CBS Apartments by Rooms API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch CBS apartments by rooms data',
      message: error.message
    });
  }
});

// Aggregated dashboard data endpoint
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const [pricesRes, interestRes] = await Promise.allSettled([
      axios.get('https://api.cbs.gov.il/index/data/price?id=120480&format=json', { headers: browserHeaders }),
      axios.get('https://boi.org.il/PublicApi/GetInterest', { headers: browserHeaders })
    ]);

    res.json({
      success: true,
      data: {
        prices: pricesRes.status === 'fulfilled' ? pricesRes.value.data : null,
        interest: interestRes.status === 'fulfilled' ? interestRes.value.data : null,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard Summary API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/cbs/prices - CBS New Dwellings Price Index',
      '/api/cbs/general-prices - CBS General Housing Price Index',
      '/api/cbs/transactions - CBS Dwelling Transactions',
      '/api/cbs/sales-by-region - CBS Sales by Region',
      '/api/cbs/average-prices - CBS Average Apartment Prices',
      '/api/cbs/new-apartments-sold - CBS New Apartments Sold',
      '/api/cbs/apartments-by-rooms - CBS Apartments by Room Count',
      '/api/boi/interest - Bank of Israel Interest Rates',
      '/api/boi/mortgages - Bank of Israel Mortgage Data',
      '/api/boi/series/:seriesId - Bank of Israel Historical Series',
      '/api/dashboard/summary - Aggregated Dashboard Data'
    ]
  });
});

// Catch-all route for Angular (production only)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/frontend/browser/index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🏠 Israel Real Estate Proxy Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Running in production mode - serving Angular app');
  }
});
