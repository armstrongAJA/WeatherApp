import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

export async function initAuth0() {
    console.log("Initializing Auth0 client...");
    try {
        auth0 = await createAuth0Client({
            domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
            cacheLocation: "localstorage",
            authorizationParams: {
                redirect_uri: window.location.origin + window.location.pathname,
                client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG"
            },
        });
        console.log("Auth0 client initialized:", auth0);
    } catch (err) {
        console.error("Error creating Auth0 client:", err);
        return;
    }

    // Check if redirected back from Auth0 login
    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
        console.log("Handling redirect callback...");
        try {
            await auth0.handleRedirectCallback();
            console.log("Redirect callback handled successfully");
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error("Error handling redirect callback:", e);
        }
    }

    await updateUI();
}

export async function updateUI() {
    console.log("Updating UI based on authentication state...");
    try {
        const isAuthenticated = await auth0.isAuthenticated();
        console.log("Is authenticated:", isAuthenticated);
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
    } catch (err) {
        console.error("Error updating UI:", err);
    }
}

export async function getAuth0Client() {
    return auth0
}

window.addEventListener("load", async () => {
    console.log("Window loaded, starting Auth0 initialization...");
    await initAuth0();

    document.getElementById("login-btn").addEventListener("click", async () => {
        console.log("Login button clicked");
        try {
            await auth0.loginWithRedirect();
            console.log("Login redirect initiated");
        } catch (e) {
            console.error("Login failed:", e);
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        console.log("Logout button clicked");
        auth0.logout({ returnTo: window.location.origin + window.location.pathname });
    });
});
