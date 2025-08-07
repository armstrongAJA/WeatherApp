// server.js                                                                                                                                                                                                
const express = require('express');
const cors = require('cors'); // allows cross-origin requests (from frontend)                                                                                                                               
const app = express();
const PORT = 3000;

app.use(cors()); // allow frontend access                                                                                                                                                                   
app.use(express.json()); // support JSON body data                                                                                                                                                          

// Example route: GET /weather?city=London                                                                                                                                                                  
app.get('/weather', (req, res) => {
  const city = req.query.city;

  // Dummy response for now — replace this with real API call                                                                                                                                               
  res.json({
    city,
    forecast: 'Sunny',
    temperature: 25
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

