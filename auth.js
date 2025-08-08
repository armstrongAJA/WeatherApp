// auth.js file
import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

export async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
    client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
    cacheLocation: "localstorage",
    authorizationParams: {
      redirect_uri: window.location.origin,
    },
  });

  // Handle redirect callback when returning from Auth0 login
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    try {
      await auth0.handleRedirectCallback({ redirect_uri: window.location.origin });
      // Remove query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error("Error handling Auth0 redirect callback:", e);
    }
  }

  await updateUI();
}

export async function updateUI() {
  if (!auth0) {
    console.warn("Auth0 client not initialized");
    return false;
  }

  const isAuthenticated = await auth0.isAuthenticated();
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

// Export function to access the auth0 client instance
export function getAuth0Client() {
  if (!auth0) {
    console.warn("Auth0 client not initialized");
  }
  return auth0;
}
