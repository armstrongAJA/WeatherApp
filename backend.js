const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { createClient } = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

const app = express();
const PORT = process.env.PORT || 3000;

<<<<<<< HEAD
// ---- 1. Connect to Redis ----
const redisClient = createClient({
  url: process.env.REDIS_URL, // e.g. redis://default:<password>@<host>:<port>
  legacyMode: true, // needed for connect-redis
});
redisClient.connect().catch(console.error);

// ---- 2. Configure session store ----
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'supersecret', // use a strong secret in .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // only send over HTTPS in prod
      httpOnly: true, // prevent JS access to cookies
      sameSite: 'lax', // helps protect against CSRF
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);

// ---- 3. CORS ----
app.use(cors({ origin: 'https://armstrongaja.github.io', credentials: true }));
=======
app.use(cors());
>>>>>>> parent of 0844453 (Update backend.js)
app.use(express.json());

// ---- 4. Auth0 token exchange (PKCE) ----
app.post('/auth/callback', async (req, res) => {
  const { code, verifier } = req.body;

  if (!code || !verifier) {
    return res.status(400).json({ error: 'Missing code or PKCE verifier' });
  }

  try {
    // Exchange code + verifier for access token
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        code_verifier: verifier,
        redirect_uri: 'https://armstrongaja.github.io/WeatherApp/about.html',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    // Store token in the server session (never send to frontend)
    req.session.accessToken = tokenResponse.data.access_token;

    res.json({ success: true });
  } catch (err) {
    console.error('Token exchange failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// ---- 5. Weather API route (backend uses token) ----
app.get('/weather', async (req, res) => {
  const { lat, lon, LOCATION } = req.query;
  const apiKey = process.env.METEOBLUEAPIKEY;

  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat, lon or LOCATION parameter' });
  }

  try {
    const url = `https://my.meteoblue.com/packages/basic-1h_basic-day?lat=${lat}&lon=${lon}&name=${LOCATION}&format=json&apikey=${apiKey}&asl=35&tz=Europe/London`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// ---- 6. Logout ----
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
