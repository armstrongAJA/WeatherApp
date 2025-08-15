// Import React and auth.js functions as ES modules
import { useState, useEffect } from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom/client";
import { login, logout, getAccessToken } from "./auth.js";

function WeatherApp() {
  const [location, setLocation] = useState("Leeds");
  const [latLon, setLatLon] = useState([null, null]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCodeMap, setWeatherCodeMap] = useState({});
  const [loading, setLoading] = useState(false);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const pictocodeToFilename = (code) => code.toString().padStart(2, "0") + "_iday.svg";

  const getLatLong = async (loc) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${loc}&country=united%20kingdom&format=json`
      );
      const result = await res.json();
      if (!result[0]) throw new Error(`No results for ${loc}`);
      return [parseFloat(result[0].lat), parseFloat(result[0].lon)];
    } catch (err) {
      console.error("Geocoding error:", err);
      return [null, null];
    }
  };

  const buildApiUrl = (lat, lon) =>
    `https://weatherapp-3o2e.onrender.com/weather?lat=${lat}&lon=${lon}&LOCATION=${location}`;

  const fetchWeatherData = async (token, lat, lon) => {
    try {
      const res = await fetch(buildApiUrl(lat, lon), {
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
    } catch (err) {
      console.error(err);
      return {};
    }
  };

  const createChartUrl = (data) => {
    const labels = data.data_day.time.map((d) =>
      new Date(d).toLocaleDateString(undefined, { weekday: "short" })
    );
    const temps = data.data_day.temperature_max;
    const chartConfig = {
      type: "bar",
      data: { labels, datasets: [{ label: "Max Temp (°C)", data: temps, backgroundColor: "rgba(0,123,255,0.7)", borderColor: "rgba(0,123,255,1)", borderWidth: 1 }] },
      options: { scales: { y: { beginAtZero: false } } },
    };
    return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));
  };

  const loadWeather = async () => {
    setLoading(true);
    const token = getAccessToken();
    const map = await loadWeatherCodeMap();
    setWeatherCodeMap(map);

    const [lat, lon] = await getLatLong(location);
    setLatLon([lat, lon]);

    if (!lat || !lon) {
      alert("Failed to get location coordinates.");
      setLoading(false);
      return;
    }

    const data = await fetchWeatherData(token, lat, lon);
    setWeatherData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadWeather();
  }, [location]);

  return (
    <div>
      <select value={location} onChange={(e) => setLocation(e.target.value)}>
        <option value="Leeds">Leeds</option>
        <option value="London">London</option>
        <option value="Manchester">Manchester</option>
      </select>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>

      {loading && <div>Loading...</div>}

      {weatherData && !loading && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Max Temp (°C)</th>
                <th>Weather</th>
              </tr>
            </thead>
            <tbody>
              {weatherData.data_day.time.map((d, i) => {
                const code = weatherData.data_day.pictocode[i];
                const weatherInfo = weatherCodeMap[code]?.text || "Unknown";
                return (
                  <tr key={i}>
                    <td>{formatDate(d)}</td>
                    <td>{weatherData.data_day.temperature_max[i].toFixed(1)}</td>
                    <td>
                      <img
                        src={`./${pictocodeToFilename(code)}`}
                        alt={weatherInfo}
                        style={{ width: 50, height: 50, display: "block", margin: "0 auto 5px" }}
                      />
                      {weatherInfo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <img src={createChartUrl(weatherData)} alt="Weather Chart" style={{ marginTop: "20px" }} />
        </div>
      )}
    </div>
  );
}

// Mount React app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<WeatherApp />);
