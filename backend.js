const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // load .env variables
const { auth } = require('express-oauth2-jwt-bearer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Set up checkJwt with relevant parameters to validate token correctly later
const checkJwt = auth({
  audience: 'https://dev-48b12ypfjnzz7foo.us.auth0.com/api/v2/',
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: 'RS256',
});

//Create POST method to pass code and verifier to the backend and initiate token exchange
//Then send token back to frontend
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

    res.json(tokenResponse.data);

  } catch (err) {
    console.error('Error exchanging code for token:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

//Add GET method to call weather API, passing relevant parameters
//Require token from frontend to successfully call the API
//Validate the token in the header with checkJwt

app.get('/weather', checkJwt, async (req, res) => {
  const { lat, lon, LOCATION } = req.query;
  const apiKey = process.env.METEOBLUEAPIKEY;

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

//Write port to console log when running (debugging)
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
