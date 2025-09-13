import endpoint from "./init";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  website?: string;
}

export async function registerUser(payload: RegisterPayload) {
  if (payload.website) {
    throw new Error("Spam detected");
  }

  const res = await fetch(`${endpoint}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}
