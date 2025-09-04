// lib/routes/http.ts

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token"); // read fresh each request
  if (!token) throw new Error("No auth token found");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

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
