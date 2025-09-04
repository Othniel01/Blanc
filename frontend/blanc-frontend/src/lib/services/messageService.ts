import endpoint from "@/lib/routes/init";

export interface Message {
  id: number;
  author_id?: number;
  username: string;
  avatar?: string;
  fallback?: string;
  message: string;
  timestamp: string;
  color?: string;
}

export interface MessageCreate {
  object_type: string;
  object_id: number;
  content: string;
  message_type?: string;
}

export async function fetchMessages(
  object_type: string,
  object_id: number
): Promise<Message[]> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${endpoint}/messages/${object_type}/${object_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch messages");
  const data = await res.json();
  return data.map((msg: any) => ({
    id: msg.id,
    author_id: msg.author_id,
    username: msg.author_id === 1 ? "You" : "User", // customize as needed
    avatar: "https://github.com/othniel01.png", // optional
    fallback: "U",
    message: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));
}

export async function sendMessage(message: MessageCreate) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${endpoint}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
