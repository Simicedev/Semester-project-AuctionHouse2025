// ...existing code...
import { post } from "../apiClient/apiClient.ts";

const TOKEN_KEY = "accessToken";
const NAME_KEY = "currentUserName";
const EMAIL_KEY = "currentUserEmail";

export type AuthState = {
  accessToken: string;
  name?: string;
  email?: string;
};

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function setAuth(state: AuthState) {
  if (state.accessToken) {
    try {
      localStorage.setItem(TOKEN_KEY, state.accessToken);
      console.log("setAuth: saved accessToken", state.accessToken.slice(0, 12) + "...");
    } catch (e) {
      console.warn("setAuth: failed to save accessToken", e);
    }
  } else {
    console.warn("setAuth: no accessToken provided");
  }
  if (state.name) localStorage.setItem(NAME_KEY, state.name);
  if (state.email) localStorage.setItem(EMAIL_KEY, state.email);
  emitAuthChanged();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
  emitAuthChanged();
}

export function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent("auth:changed"));
}

// Registration
export async function registerAccount(params: {
  name: string;
  email: string;
  password: string;
  bio?: string;
  avatar?: { url: string; alt?: string };
  banner?: { url: string; alt?: string };
  venueManager?: boolean;
}) {
  try {
    const res = await post("/auth/register", params);
    console.log("Registration successful", res);
    return res;
  } catch (e: any) {
    console.error("Registration failed:", e?.message, e?.details);
    throw e;
  }
}

// Login
export async function loginAccount(params: { email: string; password: string }) {
  try {
    const res = await post("/auth/login", params);
    // Expected shape: { data: { name, email, ... }, meta: { accessToken } } or sometimes { accessToken, data }
    const accessToken =
      res.accessToken ||
      res.meta?.accessToken ||
      res.data?.accessToken; // defensive
    const profile = res.data || {};
    if (!accessToken) {
      throw new Error("Login response missing accessToken");
    }
    setAuth({
      accessToken,
      name: profile.name,
      email: profile.email,
    });
    console.log("Login successful:", {
      name: profile.name,
      email: profile.email,
      tokenPreview: accessToken.slice(0, 12) + "...",
    });
    return res;
  } catch (e: any) {
    console.error("Login failed:", e?.message, e?.details);
    throw e;
  }
}

// Utility for debugging current auth
export function debugAuth() {
  console.log("Auth debug:", {
    isAuthenticated: isAuthenticated(),
    name: getUserName(),
    email: getUserEmail(),
    tokenPreview: localStorage.getItem(TOKEN_KEY)?.slice(0, 12) + "...",
  });
}

// ...existing code...


const form = document.querySelector("#loginForm") as HTMLFormElement | null;

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = (form.querySelector("[name=email]") as HTMLInputElement).value;
  const password = (form.querySelector("[name=password]") as HTMLInputElement).value;
  try {
    await loginAccount({ email, password });
    debugAuth();
  } catch {
    alert("Login failed. Check console.");
  }
});
// ...existing code...