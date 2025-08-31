// src/lib/services/auth.ts
export const TOKEN_KEY = "token";

// ✅ Get token
export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

// ✅ Save token
export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

// ✅ Remove token
export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ✅ Authenticated fetch wrapper
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();

  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
  };

  const res = await fetch(url, { ...options, headers });

  // If unauthorized, clear token
  if (res.status === 401) {
    clearToken();
    // optionally redirect to login here if inside client code
  }

  return res;
}
