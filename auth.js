// auth.js
let accessToken = null;
let isAuthenticated = false;

//function to get code from Auth0, then get and check token in backend
export async function initAuth0() {
    
    // Check if returning from Auth0 with a code, then get the code from url params, and verifier from local storage
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
        try {
            const code = params.get("code");
            const verifier = localStorage.getItem("pkce_verifier");
            
    // POST parameters to the backend endpoint
            const res = await fetch("https://weatherapp-3o2e.onrender.com/weather", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, verifier }),
            });

            if (!res.ok) throw new Error("Token exchange failed");
            
    // Get a token back in the response and set isAuthenticated to true
            const data = await res.json();
            accessToken = data.access_token;
            isAuthenticated = true;

    // Save token in localStorage
            localStorage.setItem("access_token", accessToken);

    // Remove parameters from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            console.error("Error during token exchange:", err);
        }
    } else {
    // Check for token and update isAuthenticated parameter accordingly
        const storedToken = localStorage.getItem("access_token");
        if (storedToken) {
            accessToken = storedToken;
            isAuthenticated = true;
        }
    }

    return isAuthenticated;
}

//create a function to login by generating PKCE verifier, then generate code challenge and URL, then redirect to log in
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

//function to log out by deleting auth parameters, then redirecting to AUTH0 logout endpoint
export function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("pkce_verifier");
    isAuthenticated = false;
    accessToken = null;

// Redirect to Auth0 logout endpoint
    window.location.href = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${RETURN_TO}`;
}

//Simple function to call to get the access token
export function getAccessToken() {
    return accessToken;
}

// function to display the login and logout buttons based on if authenticated or not
export async function updateUI() {
    document.getElementById("login-btn").style.display = isAuthenticated ? "none" : "inline-block";
    document.getElementById("logout-btn").style.display = isAuthenticated ? "inline-block" : "none";
}

// helper functions for generating code challenge
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
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// Add all the hard coded parameters here for the AUTH0 login to use when the functions are called
const AUTH0_DOMAIN = "dev-48b12ypfjnzz7foo.us.auth0.com";
const AUTH0_CLIENT_ID = "noq30FodeeaQqjfpwSCXEV1uXWqs42rG";
const REDIRECT_URI = "https://armstrongaja.github.io/WeatherApp/about.html";
const AUDIENCE = "https://dev-48b12ypfjnzz7foo.us.auth0.com/api/v2/";
const RETURN_TO = "https://armstrongaja.github.io/WeatherApp/about.html";
