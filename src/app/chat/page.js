"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

const WELCOME_MESSAGE = {
  role: "assistant",
  content: {
    intent: "general",
    reply:
      "Namaste! 🙏 I'm **Nagrik Mitra**, your AI civic companion. I can help you with:\n\n• Information about government services\n• Filing civic complaints\n• Document checklists for applications\n\nAsk me anything in Hindi, English, or Telugu!",
    suggestedActions: [
      "📄 What documents do I need for a passport?",
      "📝 File a complaint",
    ],
    complaintData: null,
  },
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const name = localStorage.getItem("nm_name");
    const phone = localStorage.getItem("nm_phone");
    if (!name || !phone) {
      router.push("/");
      return;
    }
    setUserName(name);
    setUserPhone(phone);
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build history for context (last 10 messages)
      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : msg.content.reply || "",
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();

      // If it's a complaint, auto-save to Firestore
      if (data.intent === "file_complaint" && data.complaintData) {
        try {
          const complaintRes = await fetch("/api/complaints", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: data.complaintData.category || "other",
              location: data.complaintData.location || "Not specified",
              summary: data.complaintData.summary || text.trim(),
              rawText: text.trim(),
              citizenName: userName,
              citizenPhone: userPhone,
            }),
          });
          const complaintResult = await complaintRes.json();
          if (complaintResult.success) {
            data.reply += `\n\n✅ **Complaint Registered!** Your complaint ID is **${complaintResult.complaintId}**. You can track it in My Complaints.`;
            if (!data.suggestedActions.includes("View My Complaints")) {
              data.suggestedActions.push("View My Complaints");
            }
          }
        } catch (err) {
          console.error("Failed to save complaint:", err);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: {
            intent: "general",
            reply: "Sorry, I had trouble processing that. Please try again.",
            suggestedActions: ["Try again"],
            complaintData: null,
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (action) => {
    if (action === "View My Complaints") {
      router.push("/complaints");
      return;
    }
    sendMessage(action);
  };

  // Format reply text with basic markdown-like formatting
  const formatReply = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Bold text
      let formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-slate-900">$1</strong>'
      );
      // Bullet points
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <li
            key={i}
            className="ml-4 list-disc text-slate-700"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(formatted.replace(/^[\s•-]+/, "")),
            }}
          />
        );
      }
      // Numbered items
      if (/^\d+\./.test(line.trim())) {
        return (
          <li
            key={i}
            className="ml-4 list-decimal text-slate-700"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(formatted.replace(/^\d+\.\s*/, "")),
            }}
          />
        );
      }
      // Check marks
      if (line.trim().startsWith("✅")) {
        return (
          <p
            key={i}
            className="text-emerald-700 font-medium mt-2"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }}
          />
        );
      }
      // Empty lines
      if (!line.trim()) return <br key={i} />;
      // Regular text
      return (
        <p
          key={i}
          className="text-slate-800"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }}
        />
      );
    });
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-gradient-to-br from-[#f0f4ff] to-[#e0e7ff]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Go back to Home"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-slate-600" aria-hidden="true">
                arrow_back
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg shadow-sm bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm" aria-hidden="true">
                  shield
                </span>
              </div>
              <span className="font-[family-name:var(--font-headline)] text-lg font-bold tracking-tight text-blue-700">
                Nagrik Mitra
              </span>
            </div>
          </div>
          <Link
            href="/complaints"
            id="my-complaints-link"
            aria-label="View My Complaints"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-semibold active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              inbox_text
            </span>
            <span className="hidden sm:inline">My Complaints</span>
          </Link>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto chat-scroll px-4 pt-20 pb-4 space-y-6 max-w-2xl mx-auto w-full">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const content =
            typeof msg.content === "string"
              ? { reply: msg.content, suggestedActions: [], complaintData: null }
              : msg.content;

          return (
            <div
              key={idx}
              className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} animate-fade-in-up`}
            >
              {isUser ? (
                <div className="max-w-[80%] bg-gradient-to-br from-blue-700 to-blue-600 text-white p-4 rounded-xl rounded-tr-none shadow-md">
                  <p>{typeof msg.content === "string" ? msg.content : msg.content.reply}</p>
                </div>
              ) : (
                <>
                  <div className="max-w-[85%] bg-white p-4 rounded-xl rounded-tl-none shadow-sm border border-slate-100">
                    <div className="space-y-1 leading-relaxed">
                      {formatReply(content.reply)}
                    </div>
                  </div>
                  {/* Suggested Action Chips */}
                  {content.suggestedActions &&
                    content.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {content.suggestedActions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => handleChipClick(action)}
                            className="px-4 py-2 bg-white border border-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 cursor-pointer"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                </>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 animate-fade-in-up" aria-live="polite">
            <div className="bg-white/60 px-4 py-2 rounded-full border border-slate-100 flex items-center gap-3 shadow-sm">
              <span className="text-xs font-medium text-slate-500 italic">
                Nagrik Mitra is thinking...
              </span>
              <div className="flex gap-1" aria-hidden="true">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full typing-dot" />
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Bar */}
      <footer className="bg-white border-t border-slate-100 p-4 pb-6 z-50">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto relative flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message in any language..."
              aria-label="Chat input field"
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border-none rounded-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner outline-none"
              disabled={isLoading}
              id="chat-input"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            id="send-btn"
            aria-label="Send message"
            className="w-12 h-12 flex items-center justify-center bg-blue-700 text-white rounded-full shadow-lg shadow-blue-700/20 hover:bg-blue-800 transition-transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        </form>
      </footer>
    </div>
  );
}
