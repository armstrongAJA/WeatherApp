import { createAuth0Client } from "https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js";

let auth0 = null;

export async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: "dev-48b12ypfjnzz7foo.us.auth0.com",
    cacheLocation: "localstorage",
    authorizationParams: {
      redirect_uri: window.location.origin + window.location.pathname, // stable URL
      client_id: "noq30FodeeaQqjfpwSCXEV1uXWqs42rG",
    },
  });

  // Handle redirect callback when returning from Auth0 login
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    try {
      const targetUrl = localStorage.getItem("postLoginRedirect") || "/";
      await auth0.handleRedirectCallback();
      // Remove query params from URL without reload
      window.history.replaceState({}, document.title, targetUrl);
    } catch (e) {
      console.error("Error handling Auth0 redirect callback:", e);
    }
  }

  const isAuthenticated = await auth0.isAuthenticated();
  await updateUI();
  return isAuthenticated;
}

export async function updateUI() {
  if (!auth0) {
    console.warn("Auth0 client not initialized");
    return false;
  }

  const isAuthenticated = await auth0.isAuthenticated();
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (loginBtn && logoutBtn) {
    if (isAuthenticated) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";

      const user = await auth0.getUser();
      console.log("User info:", user);
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  }

  return isAuthenticated;
}

export function getAuth0Client() {
  if (!auth0) {
    console.warn("Auth0 client not initialized");
  }
  return auth0;
}
