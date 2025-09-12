"use client";

import { useState, useRef, useEffect } from "react";
import {
  fetchMessages,
  sendMessage,
  MessageCreate,
  Message,
} from "@/lib/services/messageService";
import { fetchMe } from "@/lib/routes/project"; // <- your function
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/components/ui/avatar";
import { Button } from "@/lib/components/ui/button";
import { ArrowUp } from "lucide-react";

interface MessageBoxProps {
  object_type: string;
  object_id: number;
}

interface User {
  id: number;
  username: string;
}

export default function MessageBox({
  object_type,
  object_id,
}: MessageBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await fetchMe(); // fetch current logged-in user
        setCurrentUser(user);

        if (!object_type || !object_id) return;
        const msgs = await fetchMessages(object_type, object_id);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [object_type, object_id]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;

    const payload: MessageCreate = { object_type, object_id, content: input };

    try {
      const savedMessage = await sendMessage(payload);

      const newMsg: Message = {
        id: savedMessage.id,
        author_id: currentUser.id,
        username: currentUser.username,
        avatar: "https://github.com/othniel01.png",
        fallback: "U",
        message: savedMessage.content,
        timestamp: new Date(savedMessage.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, newMsg]);
      setInput("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-white w-[50%] h-[700px] border border-sidebar-border flex flex-col">
      <div className="message-box flex flex-col gap-5 pt-10 p-2 w-full flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="user-message flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={msg.avatar} />
              <AvatarFallback>{msg.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <h1
                  className={`font-semibold ${
                    msg.author_id === currentUser?.id
                      ? "text-blue-600"
                      : "text-gray-600"
                  } text-base`}
                >
                  {msg.username}
                </h1>
                <p className="text-xs text-gray-400">{msg.timestamp}</p>
              </div>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-gray-200 bg-white">
        <div className="border-gray-300 pr-2 rounded-md border flex items-center w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-2 py-2 outline-none"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            className="w-8 h-8 rounded-full flex items-center justify-center"
            onClick={handleSend}
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  );
}
