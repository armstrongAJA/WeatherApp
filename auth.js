// auth.js
let accessToken = null;
let codeVerifier = null;
let auth0Client = null; // placeholder for compatibility

const backendUrl = "https://weatherapp-3o2e.onrender.com"; // your backend

function generateRandomString(length) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  randomValues.forEach((v) => (result += charset[v % charset.length]));
  return result;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

function base64urlencode(bytes) {
  return btoa(String.fromCharCode.apply(null, [...bytes]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function initAuth0() {
  const params = new URLSearchParams(window.location.search);

  // Step 1 — If redirected back with code, exchange with backend
  if (params.has("code") && params.has("state")) {
    const storedState = sessionStorage.getItem("pkce_state");
    if (params.get("state") !== storedState) {
      console.error("State mismatch — possible CSRF");
      return false;
    }

    codeVerifier = sessionStorage.getItem("pkce_code_verifier");

    const code = params.get("code");

    try {
      const tokenRes = await fetch(`${backendUrl}/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          redirect_uri: window.location.origin + window.location.pathname,
        }),
      });

      if (!tokenRes.ok) throw new Error(`HTTP ${tokenRes.status}`);
      const data = await tokenRes.json();
      accessToken = data.access_token;

      // Clean up query params
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    } catch (err) {
      console.error("Token exchange failed:", err);
      return false;
    }
  }

  return false; // not authenticated yet
}

export function getAuth0Client() {
  // Kept for compatibility with weather.js — returns a fake object
  return {
    getToken: () => accessToken,
  };
}

export async function login() {
  codeVerifier = generateRandomString(64);
  const codeChallenge = base64urlencode(await sha256(codeVerifier));

  const state = generateRandomString(16);

  sessionStorage.setItem("pkce_code_verifier", codeVerifier);
  sessionStorage.setItem("pkce_state", state);

  const authUrl = `https://dev-48b12ypfjnzz7foo.us.auth0.com/authorize?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent("YOUR_CLIENT_ID")}&` +
    `redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&` +
    `scope=openid profile email&` +
    `state=${encodeURIComponent(state)}&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`;

  window.location = authUrl;
}

export function logout() {
  accessToken = null;
  window.location.href = `https://dev-48b12ypfjnzz7foo.us.auth0.com/v2/logout?client_id=YOUR_CLIENT_ID&returnTo=${encodeURIComponent(window.location.origin)}`;
}

export async function updateUI() {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (accessToken) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}
