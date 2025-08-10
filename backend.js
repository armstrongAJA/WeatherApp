const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // load .env variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * POST /weather
 * Step 1: Exchange Auth0 authorization code for tokens
 */
app.post('/weather', async (req, res) => {
  const { code, verifier } = req.body;

  if (!code || !verifier) {
    return res.status(400).json({ error: 'Missing code or PKCE verifier' });
  }

  try {
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET, // only safe on backend
        code,
        code_verifier: verifier,
        redirect_uri: 'https://armstrongaja.github.io/WeatherApp/about.html'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Send token info to frontend
    res.json(tokenResponse.data);

  } catch (err) {
    console.error('Error exchanging code for token:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

/**
 * GET /weather
 * Step 2: Require valid token, then fetch from Meteoblue
 */
app.get('/weather', async (req, res) => {
  const { lat, lon, LOCATION } = req.query;
  const authHeader = req.headers.authorization;
  const apiKey = process.env.METEOBLUEAPIKEY;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  // Optionally verify JWT here
  // For now, just check it exists
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header' });
  }

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat, lon or LOCATION parameter' });
  }

  try {
    const url = `https://my.meteoblue.com/packages/basic-1h_basic-day?lat=${lat}&lon=${lon}&name=${LOCATION}&format=json&apikey=${apiKey}&asl=35&tz=Europe/London`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching from Meteoblue:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
