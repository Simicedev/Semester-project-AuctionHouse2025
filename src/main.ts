import './style.css'
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { createHTML } from '../src/services/utils.ts';

import {
  isAuthenticated,
  getUserName,
  clearAuth,
  emitAuthChanged
} from "./storage/authentication";
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


const header = document.createElement('header');
header.id = 'header';

const main = document.createElement('main');
main.id = 'app-content';

const footer = document.createElement('footer');
footer.id = 'footer';

function renderNav() {
  
}