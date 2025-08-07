// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); // load .env variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/weather', async (req, res) => {
  const { lat, lon, LOCATION } = req.query;
  const apiKey = process.env.METEOBLUEAPIKEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat, lon or LOCATION parameter' });
  }
  try {
    const url = `https://my.meteoblue.com/packages/basic-1h_basic-day?lat=${lat}&lon=${lon}&name=${LOCATION}&format=json&apikey=${apiKey}&asl=35&tz=Europe/London`;
    const response = await axios.get(url);
    res.json(response.data); // return meteoblue data to frontend
  } catch (err) {
    console.error('Error fetching from Meteoblue:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
