import "@tailwindplus/elements";
import "./style.css";
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { isAuthenticated, getUserName, clearAuth, getProfilePicture } from "./storage/authentication";
import { Router, type Route } from "./router/router";
import { createHTML } from "./services/utils";
import { fetchListings } from "./services/listingsAPI";
let countdownInterval: number | null = null;

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


// Ensure the page uses a simple app shell so footer sits correctly
function ensureAppShell() {
  document.body.classList.add("min-h-screen", "flex", "flex-col");
  let outlet = document.getElementById("app-content") as HTMLElement | null;
  if (!outlet) {
    outlet = document.createElement("main");
    outlet.id = "app-content";
    document.body.appendChild(outlet);
  }
  outlet.classList.add("flex-1");
}


// Home view using layout utilities
export function ensureFooter(): HTMLElement {
  const outlet = document.getElementById("app-content") as HTMLElement | null;
  const root = (outlet?.parentElement ?? document.body) as HTMLElement;
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
        
    // If we have an outlet, place the footer after it; otherwise append to root
    if (outlet && outlet.parentElement) {
      outlet.parentElement.appendChild(footer);
    } else {
      root.appendChild(footer);
    }
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
                <a href="/" aria-current="page" class="rounded-md px-3 py-2 text-sm font-medium text-white">Home</a>
                <a href="#" class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/5 ">My collection</a>
                <a href="#" class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-green-700  bg-green-600">+ Create Listing</a>
                
              </div>
            </div>
          </div>
          <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <div class="rounded-md px-3 py-2 text-sm font-medium text-white">Credits</div>
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
          <a href="/" aria-current="page" class="block rounded-md  px-3 py-2 text-base font-medium text-white hover:bg-white/5">Home</a>
          <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-white/5 hover:text-white">My collection</a>
          <a href="#" class="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-green-700 hover:text-white bg-green-600">+ Create Listing</a>
          <div class="block rounded-md px-3 py-2 text-base font-medium text-white">Credits</div>
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
  const el = createHTML(`
    <section class="p-6">
      <h1 class="text-xl font-bold">404 - Page not found</h1>
    </section>
  `);
  if (el) outlet.replaceChildren(el);
}



// Initialize router
ensureAppShell();
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
  renderNav();
  ensureFooter();
  const outlet = document.getElementById("app-content");
  if (!outlet) return;
  const el = createHTML(`
    <section>
        <div class="flex flex-col items-center p-6 gap-6 bg-white rounded-lg">
          <p class="text-2xl font-bold">HammerAuctions</p>
          <div class="flex flex-row gap-6">
          <a href="#" class="font-bold">Browse All Listings</a>
        </div>
      </div>
      <div class="hero-section main-color text-white py-10 mb-6">
        
      </div>
      <div class="mx-auto max-w-7xl px-6 py-8">
        <h2 class="text-xl font-semibold mb-3 text-black">Latest listings</h2>
        <div id="home-listings" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>
      </div>
    </section>

    
  `);
  if (el) outlet.replaceChildren(el);
  loadHomeListings();
}

function formatTimeLeft(endsAtIso: string): string {
  const now = Date.now();
  const end = new Date(endsAtIso).getTime();
  const ms = Math.max(0, end - now);
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadHomeListings() {
  // Clear any existing countdown interval to avoid duplicates
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  const grid = document.getElementById("home-listings");
  if (!grid) return;
  grid.innerHTML = `<div class="text-white">Loading listings…</div>`;
  try {
    const { data } = await fetchListings({ _active: true, sort: "endsAt", sortOrder: "asc", limit: 6 });
    if (!data || data.length === 0) {
      grid.innerHTML = `<div class="text-white/80">No listings found.</div>`;
      return;
    }
    const fragments = document.createDocumentFragment();
    data.forEach((item) => {
      const cover = item.media?.[0]?.url ?? "";
      const title = item.title ?? "Untitled";
      const descRaw = (item.description ?? "").trim();
      const descShortRaw = descRaw.length > 140 ? `${descRaw.slice(0, 137)}…` : descRaw;
      const description = escapeHtml(descShortRaw);
      const timeLeft = formatTimeLeft(item.endsAt);
      const bidsCount = item._count?.bids ?? 0;
      const card = createHTML(`
        <article class="flex flex-col text-center items-center rounded-lg overflow-hidden border border-white/10 bg-white backdrop-blur shadow-md">
          ${cover ? `<img src="${cover}" alt="${item.media?.[0]?.alt ?? title}" class="w-full h-40 object-cover">` : ""}
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-2 text-black">${title}</h3>
            ${description ? `<p class="text-sm text-gray-600 mb-2">${description}</p>` : ""}
            <div class="flex items-center justify-center gap-2 text-sm w-full">
              <span class="rounded-md bg-green-600 px-2 py-0.5 text-white time-left" data-ends-at="${item.endsAt}">Ends in ${timeLeft}</span>
            </div>
            <p class="mt-2 text-sm text-gray-700">Bids: ${bidsCount}</p>
            <a href="/listings/${item.id}" data-link class="inline-block mt-3 rounded-md bg-blue-600 text-white px-3 py-1">View and Bid</a>
          </div>
        </article>
      `);
      if (card) fragments.appendChild(card);
    });
    grid.replaceChildren(fragments);

    // Start live countdown updater (once per page)
    countdownInterval = window.setInterval(() => {
      const badges = document.querySelectorAll<HTMLElement>(".time-left[data-ends-at]");
      badges.forEach((badge) => {
        const endsAt = badge.getAttribute("data-ends-at");
        if (!endsAt) return;
        const text = `Ends in ${formatTimeLeft(endsAt)}`;
        badge.textContent = text;
      });
    }, 1000);
  } catch (err: any) {
    grid.innerHTML = `<div class="text-red-300">Failed to load listings: ${err?.message ?? "Unknown error"}</div>`;
  }
}