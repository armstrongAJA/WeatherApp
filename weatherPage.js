// WeatherApp.jsx
import React, { useState, useEffect } from "react";
import { initAuth0, updateUI, login, logout, getAccessToken } from "./auth"; // Same as your original auth.js

function WeatherApp() {
  const [location, setLocation] = useState("Leeds");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [weatherCodeMap, setWeatherCodeMap] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Utility: format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch lat/lon from Nominatim API
  const getLatLong = async (loc) => {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${loc}&country=united%20kingdom&format=json`;
    try {
      const res = await fetch(geocodeUrl);
      const result = await res.json();
      if (!result[0]) throw new Error(`No results for ${loc}`);
      return [parseFloat(result[0].lat), parseFloat(result[0].lon)];
    } catch (err) {
      console.error("Geocoding error:", err);
      return [null, null];
    }
  };

  // Pictocode to filename
  const pictocodeToFilename = (code) =>
    code.toString().padStart(2, "0") + "_iday.svg";

  // Build backend API URL
  const buildApiUrl = () =>
    `https://weatherapp-3o2e.onrender.com/weather?lat=${lat}&lon=${lon}&LOCATION=${location}`;

  // Fetch weather data from backend
  const fetchWeatherData = async (token) => {
    try {
      const res = await fetch(buildApiUrl(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("Error fetching weather data:", err);
      alert("Failed to load weather data.");
      return null;
    }
  };

  // Fetch pictocode map
  const loadWeatherCodeMap = async () => {
    try {
      const res = await fetch(
        "https://www.meteoblue.com/en/weather/docs/pictogramoverview?set=daily&style=classic",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to load pictogram data");
      const pictogramData = await res.json();
      const map = {};
      pictogramData.daily.forEach((entry) => {
        map[entry.pictocode] = { text: entry.description };
      });
      return map;
    } catch (error) {
      console.error("Error loading pictocode map:", error);
      return {};
    }
  };

  // Chart URL generator
  const createChartUrl = (data) => {
    const labels = data.data_day.time.map((d) =>
      new Date(d).toLocaleDateString(undefined, { weekday: "short" })
    );
    const temps = data.data_day.temperature_max;

    const chartConfig = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Max Temp (°C)",
            data: temps,
            backgroundColor: "rgba(0, 123, 255, 0.7)",
            borderColor: "rgba(0, 123, 255, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: { scales: { y: { beginAtZero: false } } },
    };

    return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));
  };

  // Main initializer
  const initWeather = async (token) => {
    setLoading(true);

    const map = await loadWeatherCodeMap();
    setWeatherCodeMap(map);

    const [latitude, longitude] = await getLatLong(location);
    if (!latitude || !longitude) {
      alert("Failed to get location coordinates.");
      setLoading(false);
      return;
    }
    setLat(latitude);
    setLon(longitude);

    const data = await fetchWeatherData(token);
    setWeatherData(data);

    setLoading(false);
  };

  // Auth + data load on mount
  useEffect(() => {
    (async () => {
      const auth = await initAuth0();
      setIsAuthenticated(auth);
      await updateUI();
      if (auth) {
        const token = getAccessToken();
        if (token) await initWeather(token);
      }
    })();
  }, []);

  // When location changes
  useEffect(() => {
    if (isAuthenticated) {
      const token = getAccessToken();
      if (token) initWeather(token);
    }
  }, [location]);

  return (
    <div className="weather-app">
      <header>
        <h1>7-Day Weather Forecast ({location})</h1>
        <button onClick={login}>Login</button>
        <button onClick={logout}>Logout</button>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="Leeds">Leeds</option>
          <option value="London">London</option>
          <option value="Manchester">Manchester</option>
        </select>
      </header>

      {loading && <p>Loading...</p>}

      {!loading && weatherData && (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Max Temp (°C)</th>
                <th>Weather</th>
              </tr>
            </thead>
            <tbody>
              {weatherData.data_day.time.map((time, i) => {
                const code = weatherData.data_day.pictocode[i];
                const weatherInfo = weatherCodeMap[code]?.text || "Unknown";
                return (
                  <tr key={i}>
                    <td>{formatDate(time)}</td>
                    <td>{weatherData.data_day.temperature_max[i].toFixed(1)}</td>
                    <td>
                      <img
                        src={`./${pictocodeToFilename(code)}`}
                        alt={weatherInfo}
                        width={50}
                        height={50}
                        style={{ display: "block", margin: "0 auto 5px" }}
                      />
                      {weatherInfo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <img src={createChartUrl(weatherData)} alt="Weather Chart" />
        </>
      )}
    </div>
  );
}

export default WeatherApp;
