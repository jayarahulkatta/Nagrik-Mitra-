"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem("nm_name");
    const savedPhone = localStorage.getItem("nm_phone");
    if (savedName && savedPhone) {
      setIsReturning(true);
      setName(savedName);
      setPhone(savedPhone);
    }
  }, []);

  const handleStart = () => {
    if (isReturning) {
      router.push("/chat");
    } else {
      setShowOnboarding(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    localStorage.setItem("nm_name", name.trim());
    localStorage.setItem("nm_phone", phone.trim());
    router.push("/chat");
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg shadow-md bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">shield</span>
            </div>
            <span className="font-[family-name:var(--font-headline)] text-xl font-bold tracking-tight text-blue-700">
              Nagrik Mitra
            </span>
          </div>
          <button
            onClick={handleStart}
            aria-label="Get Started with Nagrik Mitra"
            className="text-blue-700 font-semibold hover:text-orange-500 transition-colors duration-200 active:scale-95 cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative pt-32 pb-20 px-6 flex-1">
        {/* Decorative Blobs */}
        <div className="blob -top-20 -left-20" />
        <div className="blob top-1/2 -right-20" />

        <section className="max-w-4xl mx-auto text-center relative z-10">
          {/* Hero Icon */}
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 rounded-2xl shadow-2xl mx-auto bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-5xl">shield</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-headline)] text-5xl md:text-7xl font-extrabold mb-4 tracking-tight gradient-text">
            Nagrik Mitra
          </h1>
          <h2 className="font-[family-name:var(--font-headline)] text-2xl md:text-3xl font-semibold text-slate-700 mb-6">
            नागरिक मित्र — Your Citizen&apos;s Friend
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Navigate government services, file civic complaints, and get document
            checklists — all through a simple AI chat in any language.
          </p>

          {/* CTA or Onboarding */}
          {!showOnboarding ? (
            <div className="animate-fade-in-up">
              <button
                onClick={handleStart}
                id="start-chatting-btn"
                aria-label="Start chatting with Nagrik Mitra"
                className="bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold py-5 px-10 rounded-2xl text-xl pulse-shadow transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-3 cursor-pointer"
              >
                {isReturning ? `Welcome back, ${name}!` : "Start Chatting"}
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 max-w-md mx-auto animate-fade-in-up">
              <div className="glass-card p-8 rounded-2xl shadow-xl text-left">
                <h3 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-blue-800 mb-2">
                  Quick Setup
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Just your name and phone — no OTP, no passwords.
                </p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="name-input"
                      className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent p-4 outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone-input"
                      className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone-input"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent p-4 outline-none transition-all"
                      required
                      pattern="[0-9]{10}"
                      title="Please enter a 10-digit phone number"
                    />
                  </div>
                  <button
                    type="submit"
                    id="save-profile-btn"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 transition-all active:scale-95 mt-4 cursor-pointer"
                  >
                    Let&apos;s Go! 🚀
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* Feature Cards */}
        <section className="max-w-5xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            {
              icon: "chat_bubble",
              title: "AI Chat Assistant",
              desc: "Ask anything about government services in Hindi, English, or Telugu.",
              color: "blue",
            },
            {
              icon: "report_problem",
              title: "File Complaints",
              desc: "Report civic issues like potholes, garbage, or broken streetlights instantly.",
              color: "orange",
            },
            {
              icon: "description",
              title: "Document Guide",
              desc: "Get checklists of required documents for any government service or application.",
              color: "emerald",
            },
          ].map((feature) => {
            const colorMap = {
              blue: {
                bg: "bg-blue-100",
                text: "text-blue-700",
                hoverBg: "group-hover:bg-blue-700",
              },
              orange: {
                bg: "bg-orange-100",
                text: "text-orange-600",
                hoverBg: "group-hover:bg-orange-600",
              },
              emerald: {
                bg: "bg-emerald-100",
                text: "text-emerald-700",
                hoverBg: "group-hover:bg-emerald-700",
              },
            };
            const c = colorMap[feature.color];
            return (
              <div
                key={feature.title}
                className="glass-card p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-6 ${c.hoverBg} group-hover:text-white transition-colors`}
                >
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h4 className="font-[family-name:var(--font-headline)] text-xl font-bold mb-3">
                  {feature.title}
                </h4>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            );
          })}
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 w-full py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-blue-800">
              Nagrik Mitra
            </span>
            <p className="text-slate-500 text-sm">
              Built for Smart Bharat Hackathon 2026
            </p>
          </div>
          <p className="text-slate-400 text-xs">
            © 2026 Nagrik Mitra. Empowering every citizen with AI.
          </p>
        </div>
      </footer>
    </main>
  );
}
