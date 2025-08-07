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
  const { lat, lon } = req.query;
  const apiKey = process.env.METEOBLUEAPIKEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon parameter' });
  }

  try {
    const url = `https://my.meteoblue.com/packages/basic-day?lat=${lat}&lon=${lon}&format=json&apikey=${apiKey}`;
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
