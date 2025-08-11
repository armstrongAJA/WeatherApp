// auth.js — Pure PKCE flow for Auth0 with backend token exchange

const AUTH0_DOMAIN = "dev-48b12ypfjnzz7foo.us.auth0.com";
const CLIENT_ID = "noq30FodeeaQqjfpwSCXEV1uXWqs42rG";
const AUDIENCE = `https://${AUTH0_DOMAIN}/api/v2/`; // or your API audience

// -------------------------
// 1. LOGIN (Generate PKCE & redirect)
// -------------------------
export async function login() {
  const redirectUri = window.location.origin + window.location.pathname;

  // Generate PKCE values
  const verifier = generateRandomString(64);
  const challenge = await pkceChallengeFromVerifier(verifier);

  // Store verifier for later
  sessionStorage.setItem("pkce_verifier", verifier);

  // Build Auth0 authorize URL
  const authorizeUrl = new URL(`https://${AUTH0_DOMAIN}/authorize`);
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    audience: AUDIENCE,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "openid profile email"
  });

  // Redirect to Auth0
  window.location = authorizeUrl.toString();
}

// -------------------------
// 2. HANDLE REDIRECT (Send code to backend)
// -------------------------
export async function handleRedirect() {
  const query = new URLSearchParams(window.location.search);

  if (query.has("code")) {
    const code = query.get("code");
    const verifier = sessionStorage.getItem("pkce_verifier");
    const redirectUri = window.location.origin + window.location.pathname;

    console.log("Auth code:", code);
    console.log("Using PKCE verifier:", verifier);

    // Send to backend for token exchange
    try {
      const res = await fetch("https://weatherapp-3o2e.onrender.com/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          verifier,
          redirect_uri: redirectUri
        })
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const tokenData = await res.json();
      console.log("Token data from backend:", tokenData);

    } catch (err) {
      console.error("Error sending code to backend:", err);
    }

    // Clean up URL
    window.history.replaceState({}, document.title, redirectUri);
  }
}

// -------------------------
// 3. LOGOUT
// -------------------------
export function logout() {
  const logoutUrl = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
  logoutUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,
    returnTo: window.location.origin + window.location.pathname
  });
  window.location = logoutUrl.toString();
}

// -------------------------
// 4. PKCE Helpers
// -------------------------
function generateRandomString(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

async function pkceChallengeFromVerifier(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
