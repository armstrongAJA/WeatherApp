// auth.js
import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;
let pkceVerifier = null; // store PKCE code_verifier

export async function initAuth0() {
    const redirectUri = window.location.origin + window.location.pathname;
    console.log("Initializing Auth0 with redirect URI:", redirectUri);

    try {
        auth0 = await createAuth0Client({
            domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
            cacheLocation: "localstorage",
            useRefreshTokens: true,
            authorizationParams: {
                client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
                redirect_uri: redirectUri,
                audience: "https://dev-48b12ypfjnzz7foo.us.auth0.com/api/v2/",
                code_challenge_method: "S256"
            }
        });
    } catch (err) {
        console.error("Error creating Auth0 client:", err);
        return false;
    }

    // If returning from Auth0 with ?code= and ?state=
    const query = new URLSearchParams(window.location.search);
    if (query.has("code") && query.has("state")) {
        console.log("Processing Auth0 redirect...");

        // Instead of calling handleRedirectCallback (which tries to fetch a token in-browser)
        // we send the code & stored PKCE verifier to the backend
        const authCode = query.get("code");
        const storedVerifier = sessionStorage.getItem("pkce_verifier");

        console.log("Auth code:", authCode);
        console.log("PKCE verifier:", storedVerifier);

        try {
            await fetch("/exchange-token", { // <-- your backend endpoint
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: authCode,
                    code_verifier: storedVerifier,
                    redirect_uri: redirectUri
                })
            });
            console.log("Code & verifier sent to backend successfully.");
        } catch (err) {
            console.error("Error sending code to backend:", err);
        }

        // Clean up URL
        window.history.replaceState({}, document.title, redirectUri);
    }

    return await updateUI();
}

export async function updateUI() {
    const isAuthenticated = await auth0.isAuthenticated();
    console.log("Is authenticated?", isAuthenticated);

    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (isAuthenticated) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        const user = await auth0.getUser();
        console.log("User info:", user);
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
    }

    return isAuthenticated;
}

export async function login() {
    const redirectUri = window.location.origin + window.location.pathname;
    console.log("Logging in with redirect URI:", redirectUri);

    // Generate PKCE code_verifier & challenge
    pkceVerifier = generateRandomString(64);
    const challenge = await pkceChallengeFromVerifier(pkceVerifier);

    // Save verifier in sessionStorage for post-login use
    sessionStorage.setItem("pkce_verifier", pkceVerifier);

    await auth0.loginWithRedirect({
        authorizationParams: {
            redirect_uri: redirectUri,
            code_challenge: challenge,
            code_challenge_method: "S256"
        }
    });
}

export function logout() {
    auth0.logout({
        logoutParams: {
            returnTo: window.location.origin + window.location.pathname
        }
    });
}

export function getAuth0Client() {
    return auth0;
}

// Helpers for PKCE
function generateRandomString(length) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let result = "";
    const values = crypto.getRandomValues(new Uint8Array(length));
    values.forEach(v => result += charset[v % charset.length]);
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
