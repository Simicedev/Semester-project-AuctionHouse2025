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
      console.log(
        "setAuth: saved accessToken",
        state.accessToken.slice(0, 12) + "..."
      );
    } catch (e) {
      console.warn("setAuth: failed to save accessToken", e);
    }
  } else {
    console.warn("setAuth: no accessToken provided");
  }
  if (state.name) localStorage.setItem(NAME_KEY, state.name);
  if (state.email) localStorage.setItem(EMAIL_KEY, state.email);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent("auth:changed"));
}
