import { useSyncExternalStore } from "react";

const TOKEN_KEY = "procrop.token";
// Keys written by the old localStorage-only login; cleared so stale identities never show.
const LEGACY_KEYS = ["procrop.session", "procrop.name", "procrop.email"];

const listeners = new Set<() => void>();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
    LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage unavailable: the session simply does not persist.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Reactive session token; null while signed out and during server rendering. */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getToken, () => null);
}
