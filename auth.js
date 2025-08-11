// auth.js — PKCE handled manually, keeps getAuth0Client() for weatherPage.js compatibility

let auth0 = null; // not actually using Auth0 SPA client for token exchange, just for UI/user info
let pkceVerifier = null;

const AUTH0_DOMAIN = "dev-48b12ypfjnzz7foo.us.auth0.com";
const CLIENT_ID = "noq30FodeeaQqjfpwSCXEV1uXWqs42rG";
const AUDIENCE = `https://${AUTH0_DOMAIN}/api/v2/`;

// -------------------------
// INIT (runs on page load)
// -------------------------
export async function initAuth0() {
    const redirectUri = window.location.origin + window.location.pathname;

    // Check for auth code from Auth0
    const query = new URLSearchParams(window.location.search);
    if (query.has("code")) {
        const code = query.get("code");
        const storedVerifier = sessionStorage.getItem("pkce_verifier");

        console.log("Auth code:", code);
        console.log("Using stored PKCE verifier:", storedVerifier);

        // Send code & verifier to backend for token exchange
        try {
            const res = await fetch("https://weatherapp-3o2e.onrender.com/weather", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    verifier: storedVerifier,
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

    return await updateUI();
}

// -------------------------
// LOGIN
// -------------------------
export async function login() {
    const redirectUri = window.location.origin + window.location.pathname;

    // Generate PKCE values
    pkceVerifier = generateRandomString(64);
    const challenge = await pkceChallengeFromVerifier(pkceVerifier);

    // Store verifier for backend token exchange
    sessionStorage.setItem("pkce_verifier", pkceVerifier);

    // Redirect to Auth0 authorize endpoint (no SPA SDK)
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

    window.location = authorizeUrl.toString();
}

// -------------------------
// LOGOUT
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
// DUMMY getAuth0Client (so weatherPage.js works)
// -------------------------
export function getAuth0Client() {
    return auth0; // We’re not using SPA client here, but keeping the function for compatibility
}

// -------------------------
// UI UPDATE (minimal demo)
// -------------------------
export async function updateUI() {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    // If we had a token in storage, we'd mark as authenticated
    const hasToken = !!sessionStorage.getItem("pkce_verifier"); // naive check for demo
    if (hasToken) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
    }

    return hasToken;
}

// -------------------------
// PKCE Helpers
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
