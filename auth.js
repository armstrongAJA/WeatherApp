let isAuthenticated = false;

// Initialize authentication
export async function initAuth0() {
    const params = new URLSearchParams(window.location.search);

    if (params.has("code")) {
        try {
            const code = params.get("code");
            const verifier = localStorage.getItem("pkce_verifier");

            const res = await fetch("https://weatherapp-3o2e.onrender.com/exchange-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // IMPORTANT: send/receive cookies
                body: JSON.stringify({ code, verifier }),
            });

            if (!res.ok) throw new Error("Token exchange failed");

            isAuthenticated = true;
            localStorage.removeItem("pkce_verifier");

            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            console.error("Error during token exchange:", err);
        }
    } else {
        // Check if session exists by calling backend
        try {
            const res = await fetch("https://weatherapp-3o2e.onrender.com/check-session", {
                credentials: "include"
            });
            isAuthenticated = res.ok;
        } catch {
            isAuthenticated = false;
        }
    }

    return isAuthenticated;
}

// Login flow
export async function login() {
    const verifier = generateCodeVerifier();
    localStorage.setItem("pkce_verifier", verifier);

    const challenge = await generateCodeChallenge(verifier);
    const authUrl = `https://${AUTH0_DOMAIN}/authorize?` +
        `response_type=code&` +
        `client_id=${AUTH0_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=openid profile email&` +
        `audience=${encodeURIComponent(AUDIENCE)}&` +
        `code_challenge=${challenge}&` +
        `code_challenge_method=S256`;

    window.location.href = authUrl;
}

// Logout flow
export function logout() {
    fetch("https://weatherapp-3o2e.onrender.com/logout", {
        method: "POST",
        credentials: "include"
    }).then(() => {
        window.location.href = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${RETURN_TO}`;
    });
}

export async function updateUI() {
    document.getElementById("login-btn").style.display = isAuthenticated ? "none" : "inline-block";
    document.getElementById("logout-btn").style.display = isAuthenticated ? "inline-block" : "none";
}

function generateCodeVerifier() {
    const array = new Uint32Array(56);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ("0" + dec.toString(16)).substr(-2)).join("");
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const AUTH0_DOMAIN = "dev-48b12ypfjnzz7foo.us.auth0.com";
const AUTH0_CLIENT_ID = "noq30FodeeaQqjfpwSCXEV1uXWqs42rG";
const REDIRECT_URI = "https://armstrongaja.github.io/WeatherApp/about.html";
const AUDIENCE = "https://dev-48b12ypfjnzz7foo.us.auth0.com/api/v2/";
const RETURN_TO = "https://armstrongaja.github.io/WeatherApp/about.html";
