  // Global variables
  let LOCATION = 'Leeds';
  let LAT = null;
  let LON = null;
  let API_URL = '';
//Add Authorisation via OAUTH0
let auth0 = null;

async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: "dev-48b12ypfjnzz7foo.us.auth0.com",     // e.g., "dev-abc123.us.auth0.com"
    client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
    cacheLocation: "localstorage", // optional: keeps user logged in after page reload
  });

  // Handle the redirect from Auth0 (if any)
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    try {
      await auth0.handleRedirectCallback();
      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      console.error('Auth0 redirect callback error', err);
    }
  }

  updateUI();
}

async function updateUI() {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    const user = await auth0.getUser();
    console.log("User info:", user);
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'block';

    // Optionally store the token
    const token = await auth0.getTokenSilently();
    console.log("Access Token:", token);

    // You can store token globally to use in API calls
    window.accessToken = token;

  } else {
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
  }
}
//End of Authorization code

  const tableBody = document.getElementById('table-body');
  const spinner = document.getElementById('spinner');
  const chart = document.getElementById('chart');
  const citySelect = document.getElementById('city-select');

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function getLatLong(location) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?city=${location}&country=united%20kingdom&format=json`;

    return fetch(geocodeUrl)
      .then(res => res.json())
      .then(result => {
        if (!result[0]) throw new Error(`No results for ${location}`);
        const { lat, lon } = result[0];
        return [parseFloat(lat), parseFloat(lon)];
      })
      .catch(err => {
        console.error('Geocoding error:', err);
        return [null, null];
      });
  }
  
function pictocodeToFilename(code) {
  const codeStr = code.toString().padStart(2, '0'); // e.g. '01', '03'
  return `${codeStr}_iday.svg`;
}
  function buildApiUrl() {
    return `https://weatherapp-3o2e.onrender.com/weather?lat=${LAT}&lon=${LON}&LOCATION=${LOCATION}`
    //return `https://my.meteoblue.com/packages/basic-1h_basic-day?lat=${LAT}&lon=${LON}&asl=35&tz=Europe/London&name=${LOCATION}&format=json&apikey=${API_KEY}`;
  }

async function fetchWeatherData() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${window.accessToken || ''}`
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching Meteoblue data:', err);
    alert('Failed to load weather data.');
    return null;
  }
}


  function populateTable(data, weatherCodeMap) {
  tableBody.innerHTML = '';
  const count = data.data_day.time.length;

  for (let i = 0; i < count; i++) {
    const tr = document.createElement('tr');

    // Date cell
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(data.data_day.time[i]);
    tr.appendChild(tdDate);

    // Max temperature cell
    const tdTemp = document.createElement('td');
    tdTemp.textContent = data.data_day.temperature_max[i].toFixed(1);
    tr.appendChild(tdTemp);

    // Weather cell with icon and text
    const tdWeather = document.createElement('td');
    const code = data.data_day.pictocode[i];
    const weatherInfo = weatherCodeMap[code]?.text || 'Unknown';

    // Create img element for the icon
    const iconImg = document.createElement('img');
    iconImg.src = `./${pictocodeToFilename(code)}`; // Ensure pictocodeToFilename returns correct filename string
    iconImg.alt = weatherInfo;
    iconImg.style.width = '50px';
    iconImg.style.height = '50px';
    iconImg.style.verticalAlign = 'middle';
    iconImg.style.display = 'block';
    iconImg.style.margin = '0 auto 5px'; // center and add space below

    tdWeather.appendChild(iconImg);
    tdWeather.appendChild(document.createTextNode(weatherInfo));
    tr.appendChild(tdWeather);

    tableBody.appendChild(tr);
  }
}


  function createChartUrl(data) {
    const labels = data.data_day.time.map(d => {
      return new Date(d).toLocaleDateString(undefined, { weekday: 'short' });
    });

    const temps = data.data_day.temperature_max;

    const chartConfig = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Max Temp (°C)',
          data: temps,
          backgroundColor: 'rgba(0, 123, 255, 0.7)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: false }
        }
      }
    };

    return 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartConfig));
  }
  async function loadWeatherCodeMap() {
    const pictogramUrl = "https://www.meteoblue.com/en/weather/docs/pictogramoverview?set=daily&style=classic";
  
    try {
      const res = await fetch(pictogramUrl, {
        headers: {
          "Accept": "application/json"
        }
      });
  
      if (!res.ok) throw new Error('Failed to load pictogram data');
  
      const pictogramData = await res.json();
  
      const map = {};
      pictogramData.daily.forEach(entry => {
        const code = entry.pictocode;
        const description = entry.description;
        map[code] = { text: description };
      });
      console.log('pictogramdata:', map)
  
      return map;
  
    } catch (error) {
      console.error('Error loading pictocode map:', error);
      return {};
    }
  }

  async function init() {
    spinner.style.display = 'block';
    chart.style.display = 'none';
    weatherCodeMap = await loadWeatherCodeMap();
    console.log(weatherCodeMap);
    const [lat, lon] = await getLatLong(LOCATION);
    if (!lat || !lon) {
      alert('Failed to get location coordinates.');
      return;
    }
    LAT = lat;
    LON = lon;
    API_URL = buildApiUrl();

    const data = await fetchWeatherData();
    if (data) {
      populateTable(data, weatherCodeMap);
      chart.src = createChartUrl(data);
      chart.style.display = 'block';
    } else {
      tableBody.innerHTML = '<tr><td colspan="3">No data available</td></tr>';
    }

    spinner.style.display = 'none';
    document.getElementById('pageHeader').textContent = `7-Day Weather Forecast (${LOCATION})`;
  }

  // Event listeners
  citySelect.addEventListener('change', async () => {
    LOCATION = citySelect.value;
    await init();
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'flex';
  });

  document.getElementById('ok-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  window.addEventListener('click', (event) => {
    if (event.target === document.getElementById('modal')) {
      document.getElementById('modal').style.display = 'none';
    }
  });

  document.getElementById('login-btn').addEventListener('click', async () => {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin,
    });
  });
  
  document.getElementById('logout-btn').addEventListener('click', () => {
    auth0.logout({
      returnTo: window.location.origin,
    });
  });

window.addEventListener('DOMContentLoaded', async () => {
  // Wait until Auth0 script defines createAuth0Client
  while (typeof createAuth0Client === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Now safe to init Auth0
  await initAuth0();

  if (await auth0.isAuthenticated()) {
    await init();
  }
});

