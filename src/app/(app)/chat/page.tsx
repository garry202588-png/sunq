"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUBJECTS = [
  { value: "通用", label: "🌟 通用" },
  { value: "语文", label: "📖 语文" },
  { value: "数学", label: "🔢 数学" },
  { value: "英语", label: "🔤 英语" },
  { value: "物理", label: "⚡ 物理" },
  { value: "历史", label: "📜 历史" },
  { value: "生物", label: "🌱 生物" },
];

export default function ChatPage() {
  const [subject, setSubject] = useState("通用");
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { subject },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue("");
  }

  return (
    <div className="flex h-[calc(100svh-5rem)] flex-col">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">💬 AI 问答学伴</h1>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSubject(s.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition-all ${
                subject === s.value
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-lg space-y-3">
          {messages.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <p className="text-4xl mb-3">🤔</p>
              <p>有什么不懂的，尽管问我~</p>
              <p className="mt-1 text-xs">选择学科标签，获得更专业的回答</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-pink-600 text-white"
                    : "bg-white shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {msg.parts?.map((part, i) =>
                    part.type === "text" ? <span key={i}>{part.text}</span> : null
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="animate-bounce text-gray-400">●</span>
                  <span className="animate-bounce text-gray-400 [animation-delay:0.1s]">●</span>
                  <span className="animate-bounce text-gray-400 [animation-delay:0.2s]">●</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入你的问题..."
            className="h-11"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-11 px-6"
            disabled={isLoading || !inputValue.trim()}
          >
            发送
          </Button>
        </form>
      </div>
    </div>
  );
}
