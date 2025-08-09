import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

export async function initAuth0() {
    const redirectUri = "https://armstrongaja.github.io/WeatherApp/about.html"; // Full current page

    console.log("Initializing Auth0 with redirect URI:", redirectUri);

    try {
        auth0 = await createAuth0Client({
            domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
            cacheLocation: "localstorage",
            useRefreshTokens: true,
            authorizationParams: {
                client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
                redirect_uri: redirectUri // must match exactly what is in Auth0 Allowed Callback URLs
            }
        });
    } catch (err) {
        console.error("Error creating Auth0 client:", err);
        return false;
    }

    // Handle Auth0 redirect
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
        console.log("Processing Auth0 redirect...");
        try {
            const { appState } = await auth0.handleRedirectCallback();
            console.log("Redirect handled successfully:", appState);

            // Remove query params
            window.history.replaceState({}, document.title, appState?.targetUrl || redirectUri);
        } catch (e) {
            console.error("Error handling redirect callback:", e);
        }
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

    await auth0.loginWithRedirect({
        authorizationParams: {
            redirect_uri: redirectUri
        },
        appState: { targetUrl: window.location.pathname }
    });
}

export function logout() {
    auth0.logout({
        logoutParams: { returnTo: window.location.origin }
    });
}

export function getAuth0Client() {
    return auth0;
}
