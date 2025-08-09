// auth.js
import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

export async function initAuth0() {
  const redirectUri = window.location.origin + window.location.pathname; // exact current page

  auth0 = await createAuth0Client({
    domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
    cacheLocation: "localstorage",
    authorizationParams: {
      redirect_uri: redirectUri,
      client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG"
    }
  });

  // Handle redirect from Auth0
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    try {
      await auth0.handleRedirectCallback(); // SDK already knows redirect_uri
    } catch (err) {
      console.error("Error handling Auth0 redirect callback:", err);
    }

    // Remove ?code=...&state=... from the URL
    window.history.replaceState({}, document.title, redirectUri);
  }

  // Return whether authenticated
  return await auth0.isAuthenticated();
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

export async function login() {
  const redirectUri = window.location.origin + window.location.pathname;
  await auth0.loginWithRedirect({ redirect_uri: redirectUri });
}

export function logout() {
  auth0.logout({ logoutParams: { returnTo: window.location.origin } });
}

export function getAuth0Client() {
  return auth0;
}
