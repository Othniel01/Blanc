import endpoint from "./init";

let refreshPromise: Promise<string> | null = null;

// Helper to refresh token safely
async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    refreshPromise = fetch(`${endpoint}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          throw new Error("Session expired, please log in again.");
        }
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function authFetch(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem("access_token");
  if (!token) throw new Error("No auth token found");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    try {
      token = await refreshAccessToken();

      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      throw err;
    }
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) message = data.detail;
    } catch {}
    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export { refreshAccessToken };
export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}
