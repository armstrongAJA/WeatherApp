import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
    client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
    cacheLocation: "localstorage",
    authorizationParams: {
      redirect_uri: window.location.origin
    },
  });

  // Check if we are returning from Auth0 login redirect
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    try {
      // Handle the redirect and process tokens
      await auth0.handleRedirectCallback( redirect_uri: window.location.origin );

      // Clean the URL removing query params (without page reload)
      window.history.replaceState({}, document.title, window.location.pathname);

    } catch (e) {
      console.error("Error handling Auth0 redirect callback:", e);
    }
  }

  await updateUI(); // your function to update page UI/auth state
}


async function updateUI() {
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
        auth0.logout({ returnTo: window.location.origin });
    });
});
