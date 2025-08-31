"use client";

import { useState, useRef, useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/components/ui/avatar";
import { ArrowUp } from "lucide-react";
import { Button } from "@/lib/components/ui/button";

// Mock messages (in real app, you’d fetch from API or WebSocket)
const initialMessages = [
  {
    id: 1,
    username: "othniel01",
    avatar: "https://github.com/Othniel01.png",
    fallback: "OT",
    message: "Hello World!, this is my first text message.",
    timestamp: "8:22pm",
    color: "text-teal-600",
  },
  {
    id: 2,
    username: "daisy",
    avatar: "https://github.com/shadcn.png",
    fallback: "DS",
    message: "I recorded that.",
    timestamp: "8:25pm",
    color: "text-pink-600",
  },
];

export default function MessageBox() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      username: "you",
      avatar: "https://github.com/othniel01.png",
      fallback: "U",
      message: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      color: "text-blue-600",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-white w-1/2 h-[700px]  border border-sidebar-border  flex flex-col">
      {/* Messages container (scrollable, fixed height) */}

      <div className="message-box  flex flex-col gap-5 pt-10 p-2 w-full flex-1 overflow-y-auto">
        <div className="flex gap-4 items-center">
          <div className="w-full h-[1px] bg-sidebar-border"></div>
          <p className="text-gray-400 text-sm">Today</p>
          <div className="w-full h-[1px] bg-sidebar-border"></div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="user-message flex items-center gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src={msg.avatar} />
              <AvatarFallback>{msg.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <h1 className={`font-semibold ${msg.color} text-base`}>
                  {msg.username}
                </h1>
                <p className="text-xs text-gray-400">{msg.timestamp}</p>
              </div>
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar (fixed at bottom) */}
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
