// weather.js
import { initAuth0, updateUI} from "./auth.js";

// Global variables
let LOCATION = "Leeds";
let LAT = null;
let LON = null;
let API_URL = "";
let weatherCodeMap = {};

const tableBody = document.getElementById("table-body");
const spinner = document.getElementById("spinner");
const chart = document.getElementById("chart");
const citySelect = document.getElementById("city-select");

// Format date strings nicely
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

// Geocode city to lat/lon
async function getLatLong(location) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${location}&country=united%20kingdom&format=json`;
    try {
        const res = await fetch(geocodeUrl);
        const result = await res.json();
        if (!result[0]) throw new Error(`No results for ${location}`);
        const { lat, lon } = result[0];
        return [parseFloat(lat), parseFloat(lon)];
    } catch (err) {
        console.error("Geocoding error:", err);
        return [null, null];
    }
}

// Map pictocode to local filename
function pictocodeToFilename(code) {
    return code.toString().padStart(2, "0") + "_iday.svg";
}

// Build API URL for weather
function buildApiUrl() {
    return `https://weatherapp-3o2e.onrender.com/weather?lat=${LAT}&lon=${LON}&LOCATION=${LOCATION}`;
}

// Fetch weather data with token
async function fetchWeatherData(token) {
    try {
        const res = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("Error fetching weather data:", err);
        alert("Failed to load weather data.");
        return null;
    }
}

// Populate weather table
function populateTable(data) {
    tableBody.innerHTML = "";
    const count = data.data_day.time.length;

    for (let i = 0; i < count; i++) {
        const tr = document.createElement("tr");

        const tdDate = document.createElement("td");
        tdDate.textContent = formatDate(data.data_day.time[i]);
        tr.appendChild(tdDate);

        const tdTemp = document.createElement("td");
        tdTemp.textContent = data.data_day.temperature_max[i].toFixed(1);
        tr.appendChild(tdTemp);

        const tdWeather = document.createElement("td");
        const code = data.data_day.pictocode[i];
        const weatherInfo = weatherCodeMap[code]?.text || "Unknown";

        const iconImg = document.createElement("img");
        iconImg.src = `./${pictocodeToFilename(code)}`;
        iconImg.alt = weatherInfo;
        iconImg.style.width = "50px";
        iconImg.style.height = "50px";
        iconImg.style.display = "block";
        iconImg.style.margin = "0 auto 5px";

        tdWeather.appendChild(iconImg);
        tdWeather.appendChild(document.createTextNode(weatherInfo));
        tr.appendChild(tdWeather);

        tableBody.appendChild(tr);
    }
}

// Create chart URL for QuickChart
function createChartUrl(data) {
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
        options: {
            scales: {
                y: { beginAtZero: false },
            },
        },
    };

    return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));
}

// Load weather code mapping from meteoblue
async function loadWeatherCodeMap() {
    const pictogramUrl =
        "https://www.meteoblue.com/en/weather/docs/pictogramoverview?set=daily&style=classic";
    try {
        const res = await fetch(pictogramUrl, {
            headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to load pictogram data");

        const pictogramData = await res.json();
        const map = {};
        pictogramData.daily.forEach((entry) => {
            map[entry.pictocode] = { text: entry.description };
        });
        console.log("Pictogram data loaded:", map);
        return map;
    } catch (error) {
        console.error("Error loading pictocode map:", error);
        return {};
    }
}

// Initialize weather data and UI, passing accessToken from auth.js
async function initWeather(accessToken) {
    spinner.style.display = "block";
    chart.style.display = "none";

    weatherCodeMap = await loadWeatherCodeMap();

    const [lat, lon] = await getLatLong(LOCATION);
    if (!lat || !lon) {
        alert("Failed to get location coordinates.");
        spinner.style.display = "none";
        return;
    }

    LAT = lat;
    LON = lon;
    API_URL = buildApiUrl();

    const data = await fetchWeatherData(accessToken);

    if (data) {
        populateTable(data);
        chart.src = createChartUrl(data);
        chart.style.display = "block";
    } else {
        tableBody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }

    spinner.style.display = "none";

    document.getElementById("pageHeader").textContent = `7-Day Weather Forecast (${LOCATION})`;
}

// Event listeners for city select
citySelect.addEventListener("change", async () => {
    LOCATION = citySelect.value;
    // Get token and re-init weather data after location change
    const auth0 = getAuth0Client();
    if (!auth0) return;
    const token = await auth0.getTokenSilently();
    await initWeather(token);
});

document.getElementById("back-btn").addEventListener("click", () => {
    document.getElementById("modal").style.display = "flex";
});

document.getElementById("ok-btn").addEventListener("click", () => {
    window.location.href = "index.html";
});

window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("modal")) {
        document.getElementById("modal").style.display = "none";
    }
});

// On window load, initialize Auth0, then weather if authenticated
window.addEventListener("load", async () => {
    try {
        await initAuth0();

        // Attach login/logout button handlers
        document.getElementById("login-btn").addEventListener("click", async () => {
            const auth0 = getAuth0Client();
            if (!auth0) return;
            await auth0.loginWithRedirect({ redirect_uri: window.location.origin });
        });

        document.getElementById("logout-btn").addEventListener("click", async () => {
            const auth0 = getAuth0Client();
            if (!auth0) return;
            auth0.logout({ returnTo: window.location.origin });
        });

        // Update UI and if authenticated, load weather data
        const isAuthenticated = await updateUI();

        if (isAuthenticated) {
            const auth0 = getAuth0Client();
            const token = await auth0.getTokenSilently();
            await initWeather(token);
        }
    } catch (err) {
        console.error("Error initializing app:", err);
    }
});
