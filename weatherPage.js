// WeatherApp.jsx
import React, { useState, useEffect } from "react";
import { initAuth0, updateUI, login, logout, getAccessToken } from "./auth"; // Same as your original auth.js
import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
function WeatherApp() {
  const [location, setLocation] = useState("Leeds");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [weatherCodeMap, setWeatherCodeMap] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Utility: format date
  const formatDate = dateStr => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  // Fetch lat/lon from Nominatim API
  const getLatLong = async loc => {
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
  const pictocodeToFilename = code => code.toString().padStart(2, "0") + "_iday.svg";

  // Build backend API URL
  const buildApiUrl = () => `https://weatherapp-3o2e.onrender.com/weather?lat=${lat}&lon=${lon}&LOCATION=${location}`;

  // Fetch weather data from backend
  const fetchWeatherData = async token => {
    try {
      const res = await fetch(buildApiUrl(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      const res = await fetch("https://www.meteoblue.com/en/weather/docs/pictogramoverview?set=daily&style=classic", {
        headers: {
          Accept: "application/json"
        }
      });
      if (!res.ok) throw new Error("Failed to load pictogram data");
      const pictogramData = await res.json();
      const map = {};
      pictogramData.daily.forEach(entry => {
        map[entry.pictocode] = {
          text: entry.description
        };
      });
      return map;
    } catch (error) {
      console.error("Error loading pictocode map:", error);
      return {};
    }
  };

  // Chart URL generator
  const createChartUrl = data => {
    const labels = data.data_day.time.map(d => new Date(d).toLocaleDateString(undefined, {
      weekday: "short"
    }));
    const temps = data.data_day.temperature_max;
    const chartConfig = {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Max Temp (°C)",
          data: temps,
          backgroundColor: "rgba(0, 123, 255, 0.7)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    };
    return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));
  };

  // Main initializer
  const initWeather = async token => {
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
  return /*#__PURE__*/_jsxs("div", {
    className: "weather-app",
    children: [/*#__PURE__*/_jsxs("header", {
      children: [/*#__PURE__*/_jsxs("h1", {
        children: ["7-Day Weather Forecast (", location, ")"]
      }), /*#__PURE__*/_jsx("button", {
        onClick: login,
        children: "Login"
      }), /*#__PURE__*/_jsx("button", {
        onClick: logout,
        children: "Logout"
      }), /*#__PURE__*/_jsxs("select", {
        value: location,
        onChange: e => setLocation(e.target.value),
        children: [/*#__PURE__*/_jsx("option", {
          value: "Leeds",
          children: "Leeds"
        }), /*#__PURE__*/_jsx("option", {
          value: "London",
          children: "London"
        }), /*#__PURE__*/_jsx("option", {
          value: "Manchester",
          children: "Manchester"
        })]
      })]
    }), loading && /*#__PURE__*/_jsx("p", {
      children: "Loading..."
    }), !loading && weatherData && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsxs("table", {
        children: [/*#__PURE__*/_jsx("thead", {
          children: /*#__PURE__*/_jsxs("tr", {
            children: [/*#__PURE__*/_jsx("th", {
              children: "Date"
            }), /*#__PURE__*/_jsx("th", {
              children: "Max Temp (\xB0C)"
            }), /*#__PURE__*/_jsx("th", {
              children: "Weather"
            })]
          })
        }), /*#__PURE__*/_jsx("tbody", {
          children: weatherData.data_day.time.map((time, i) => {
            var _weatherCodeMap$code;
            const code = weatherData.data_day.pictocode[i];
            const weatherInfo = ((_weatherCodeMap$code = weatherCodeMap[code]) === null || _weatherCodeMap$code === void 0 ? void 0 : _weatherCodeMap$code.text) || "Unknown";
            return /*#__PURE__*/_jsxs("tr", {
              children: [/*#__PURE__*/_jsx("td", {
                children: formatDate(time)
              }), /*#__PURE__*/_jsx("td", {
                children: weatherData.data_day.temperature_max[i].toFixed(1)
              }), /*#__PURE__*/_jsxs("td", {
                children: [/*#__PURE__*/_jsx("img", {
                  src: `./${pictocodeToFilename(code)}`,
                  alt: weatherInfo,
                  width: 50,
                  height: 50,
                  style: {
                    display: "block",
                    margin: "0 auto 5px"
                  }
                }), weatherInfo]
              })]
            }, i);
          })
        })]
      }), /*#__PURE__*/_jsx("img", {
        src: createChartUrl(weatherData),
        alt: "Weather Chart"
      })]
    })]
  });
}
export default WeatherApp;
