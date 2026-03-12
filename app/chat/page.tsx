"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Send, Paperclip } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const PLACEHOLDER_MSGS: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm your family health assistant. Ask me anything about your family's health records, upcoming appointments, or care journeys.",
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(PLACEHOLDER_MSGS);
  const [input, setInput]       = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const replyMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Thanks for your message! AI-powered responses are coming soon. For now this is a UI preview.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, replyMsg]);
    setInput("");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100dvh-5rem)]">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-2xl font-extrabold text-heading">Chat</h1>
          <p className="text-xs text-muted mt-0.5">Family health assistant · UI preview</p>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-3xl text-sm font-medium leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#3A3370] text-white rounded-br-lg"
                    : "bg-white shadow-card text-body rounded-bl-lg"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          className="flex-shrink-0 px-4 py-3 border-t border-border bg-white flex items-end gap-2"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip size={18} className="text-muted" />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your family's health…"
            rows={1}
            className="flex-1 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-heading placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#C9C3E6] resize-none transition max-h-32"
            style={{ lineHeight: "1.5" }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-2xl bg-[#3A3370] flex items-center justify-center flex-shrink-0 transition active:scale-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
