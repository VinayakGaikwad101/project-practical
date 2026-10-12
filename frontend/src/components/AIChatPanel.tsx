"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles, X } from "lucide-react";
import { ChatSkeleton } from "./ui/Skeleton";

export interface ChatMsg {
  role: "user" | "ai";
  content: string;
  proposedContent?: string;
  retryAttempt?: number;
  activeKeyMasked?: string;
}

interface AIChatPanelProps {
  messages: ChatMsg[];
  isLoading: boolean;
  selectedText?: string;
  onSendMessage: (text: string) => void;
  onQuickAction: (actionPrompt: string) => void;
  onClearSelection?: () => void;
}

export function AIChatPanel({
  messages,
  isLoading,
  selectedText,
  onSendMessage,
  onQuickAction,
  onClearSelection,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <aside className="w-80 lg:w-96 border-l border-stone-200/80 bg-stone-50/50 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-stone-100 text-stone-700 rounded border border-stone-200">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-stone-900 tracking-tight">Assistant</h3>
            <p className="text-[10px] text-stone-400 font-mono">Editorial Copilot</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-2.5 text-xs ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
                msg.role === "user"
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-700 border-stone-200"
              }`}
            >
              {msg.role === "user" ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-stone-900 text-stone-100 rounded-tr-none"
                  : "bg-white text-stone-800 border border-stone-200 shadow-xs rounded-tl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.retryAttempt && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-medium border border-stone-200">
                  <span>Auto-retried (attempt #{msg.retryAttempt})</span>
                </div>
              )}
              {msg.proposedContent && (
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-1.5 text-stone-700 font-semibold text-[11px]">
                  <span>Proposal applied to preview</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && <ChatSkeleton />}
      </div>

      {/* Input Form with Selected Text Card Positioned Directly Above It */}
      <form onSubmit={handleSubmit} className="border-t border-stone-200/80 bg-white p-3 space-y-2">
        {/* Selected text indicator badge directly above the input */}
        {selectedText && (
          <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs shadow-2xs animate-in fade-in-50 slide-in-from-bottom-2 duration-150">
            <div className="font-medium text-stone-800 flex items-center justify-between">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                Selected Text Target
              </span>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded hover:bg-stone-200/60 transition cursor-pointer"
                title="Clear selected target"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-stone-700 italic line-clamp-2 mt-1 text-[11px] bg-white p-1.5 rounded border border-stone-200/70 font-serif">
              "{selectedText}"
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <button
                type="button"
                onClick={() => onQuickAction(`Rewrite this selected text to be more concise and professional: "${selectedText}"`)}
                className="px-2 py-0.5 bg-white text-[10px] font-medium text-stone-700 border border-stone-200 rounded hover:bg-stone-100 transition cursor-pointer"
              >
                Rephrase
              </button>
              <button
                type="button"
                onClick={() => onQuickAction(`Fix grammar, punctuation, and tone for: "${selectedText}"`)}
                className="px-2 py-0.5 bg-white text-[10px] font-medium text-stone-700 border border-stone-200 rounded hover:bg-stone-100 transition cursor-pointer"
              >
                Fix Grammar
              </button>
              <button
                type="button"
                onClick={() => onQuickAction(`Summarize this highlighted section in bullet points: "${selectedText}"`)}
                className="px-2 py-0.5 bg-white text-[10px] font-medium text-stone-700 border border-stone-200 rounded hover:bg-stone-100 transition cursor-pointer"
              >
                Summarize
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedText ? "Instruction for selected text..." : "Type a command or instruction..."}
            disabled={isLoading}
            className="flex-1 bg-stone-50 text-stone-900 text-xs px-3 py-2 rounded-md border border-stone-200 focus:outline-none focus:border-stone-800 disabled:opacity-60 placeholder:text-stone-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-md transition shadow-xs shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
