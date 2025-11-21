import "@tailwindplus/elements";
import "./style.css";
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { isAuthenticated, getUserName, clearAuth, getProfilePicture } from "./storage/authentication";
import { Router, type Route } from "./router/router";
import { renderView } from "./layout/layout";
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  
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


// Example component for the home page (can be expanded later)
function HomeHero(): HTMLElement {
  const app = document.getElementById("app-root");
  const section = document.createElement("section");
  section.className = "bg-color p-6 space-y-4";
  section.innerHTML = `
    <h1 class="text-xl font-bold">Welcome to sm-auctionhouse2025!</h1>
    <p class="mt-2">Browse, bid, and win your favorite items.</p>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4" id="featured-listings"></div>
  `;
  return section;
}

// Home view using layout utilities
export function ensureFooter(): HTMLElement {
  let root = document.getElementById("app-root") as HTMLElement | null;
  if (!root) {
    root = document.createElement("div");
    root.id = "app-root";
    root.className = "min-h-screen flex flex-col";
    document.body.appendChild(root);
  }
  let footer = document.getElementById("site-footer") as HTMLElement | null;
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "site-footer";
    footer.className = "flex flex-col mt-auto p-6 text-sm text-gray-400 border-t border-gray-800 main-color";
      footer.innerHTML = `
      <div class="mb-2 gap-6 flex flex-wrap flex-col justify-center">
            <span class="mx-2 text-2xl">AuctionHouse</span>
            <span class="mx-2">Worlds largest auction house since 1950</span>
            <span class="mx-2">Oslo / Kristiansand, Henrik Wergelands gate 93</span>
            <span class="mx-2">info@auctionhouse.com</span>
            <span class="mx-2">+47 123 45 678</span>
        </div>
        
        <div class="mt-4 border-t"></div>
            <span class="mt-6">&copy; ${new Date().getFullYear()} AuctionHouse. All rights reserved.</span>
            `
        
    root.appendChild(footer);
  }
  return footer;
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
    <nav class="relative main-color after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
      <div class="mx-auto px-2 sm:px-6 lg:px-8">
        <div class="relative flex h-16 items-center justify-between">
          <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <!-- Mobile menu button-->
            <button type="button" command="--toggle" commandfor="mobile-menu" class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
              <span class="absolute -inset-0.5"></span>
              <span class="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 in-aria-expanded:hidden">
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 not-in-aria-expanded:hidden">
                <path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div class="hidden sm:ml-6 sm:block">
              <div class="flex space-x-4">
                <!-- Current: "bg-gray-950/50 text-white", Default: "text-gray-300 hover:bg-white/5 hover:text-white" -->
                <a href="#" aria-current="page" class="rounded-md bg-gray-950/50 px-3 py-2 text-sm font-medium text-white">Home</a>
                <a href="#" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">My collection</a>
                <a href="#" class="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">+ Create Listing</a>
                
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <div class="rounded-md px-3 py-2 text-sm font-medium">Credits</div>
            <button type="button" class="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500">
              <span class="absolute -inset-1.5"></span>
              <span class="sr-only">View notifications</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6">
                <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <!-- Profile dropdown -->
            <el-dropdown class="relative ml-3">
              <button class="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                <span class="absolute -inset-1.5"></span>
                <span class="sr-only">Open user menu</span>
                <img src="${getProfilePicture()}" alt="profile picture" class="size-8 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10" /> 
              </button>

              <el-menu anchor="bottom end" popover class="w-48 origin-top-right rounded-md bg-gray-800 py-1 outline -outline-offset-1 outline-white/10 transition transition-discrete [--anchor-gap:--spacing(2)] data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in">
                <div class="block px-4 py-2 text-sm text-gray-300">Hello, ${name}</div>
                <a href="#" class="block px-4 py-2 text-sm text-gray-300 focus:bg-white/5 focus:outline-hidden">Your profile</a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-300 focus:bg-white/5 focus:outline-hidden">Settings</a>
                <a href="#" data-logout class="block px-4 py-2 text-sm text-gray-300 focus:bg-white/5 focus:outline-hidden">Sign out</a>
              </el-menu>
            </el-dropdown>
          </div>
        </div>
      </div>

      <el-disclosure id="mobile-menu" hidden class="block sm:hidden">
        <div class="space-y-1 px-2 pt-2 pb-3">
          <!-- Current: "bg-gray-950/50 text-white", Default: "text-gray-300 hover:bg-white/5 hover:text-white" -->
          <a href="#" aria-current="page" class="block rounded-md bg-gray-950/50 px-3 py-2 text-base font-medium text-white">Home</a>
          <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white">My collection</a>
          <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white">+ Create Listing</a>
          <div class="block rounded-md px-3 py-2 text-base font-medium">Credits</div>
        </div>
      </el-disclosure>
</nav>
    `
    : `
      <div class="flex justify-between p-4 main-color text-white gap-4">
        <a href="/" data-link class="font-semibold">Home</a>
        <div class="flex gap-4">
          <a href="/login" data-link>Login</a>
          <a href="/register" data-link>Register</a>
        </div>
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

router.resolve();

window.addEventListener("auth:changed", () => {
  renderNav();
});

function renderHome() {
  ensureFooter();
  renderView(HomeHero());
  renderNav();
}