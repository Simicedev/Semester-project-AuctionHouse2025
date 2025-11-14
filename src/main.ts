import "./style.css";
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { isAuthenticated, getUserName, clearAuth } from "./storage/authentication";
import { Router, type Route } from "./router/router";
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Register our service worker file
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
};


// Simple home view
function renderHome() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;
  outlet.innerHTML = `
    <section class="p-6">
      <h1 class="text-2xl font-bold">Welcome</h1>
      <p>Use the navigation to Login or Register.</p>
    </section>
  `;
}

function ensureNav(): HTMLElement {
  let nav = document.getElementById("site-nav") as HTMLElement | null;
  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "site-nav";
    // Insert before app-content if available, otherwise at top of body
    const outlet = document.getElementById("app-content");
    if (outlet && outlet.parentElement) {
      outlet.parentElement.insertBefore(nav, outlet);
    } else {
      document.body.prepend(nav);
    }
  }
  return nav;
}

function renderNav() {
  const nav = ensureNav();
  const authenticated = isAuthenticated();
  const name = getUserName();
  nav.innerHTML = authenticated
    ? `
      <div class="p-4 bg-gray-800 text-white flex gap-4 items-center">
        <a href="/" data-link class="font-semibold">Home</a>
        <span class="opacity-80">Signed in as ${name ?? "User"}</span>
        <a href="#" data-logout class="ml-auto underline">Logout</a>
      </div>
    `
    : `
      <div class="p-4 bg-gray-800 text-white flex gap-4">
        <a href="/login" data-link>Login</a>
        <a href="/register" data-link>Register</a>
      </div>
    `;

  // Attach logout handler if present
  const logoutLink = nav.querySelector("[data-logout]") as HTMLAnchorElement | null;
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      clearAuth();
      // After logout, route to home
      history.pushState({ path: "/" }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
}

function renderNotFound() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;
  outlet.innerHTML = `<section class="p-6"><h1 class="text-xl font-bold">404 - Page not found</h1></section>`;
}

// Initialize router
const routes: Route[] = [
  { path: "/", view: renderHome },
  { path: "/login", view: renderLogin },
  { path: "/register", view: renderRegister },
];

const outletEl = document.getElementById("app-content") as HTMLElement | null;
const router = new Router(routes, outletEl ?? document.body, renderNotFound);

// Initial render
renderNav();
router.resolve();

// Optional: react to auth changes (e.g., could re-render nav or route)
window.addEventListener("auth:changed", () => {
  renderNav();
});