"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_CONFIG = {
  Submitted: {
    bg: "bg-blue-600",
    text: "text-white",
    label: "Submitted",
  },
  "In Progress": {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "In Progress",
  },
  Resolved: {
    bg: "bg-emerald-600",
    text: "text-white",
    label: "Resolved",
  },
};

const CATEGORY_CONFIG = {
  streetlight: { icon: "lightbulb", label: "Streetlight", color: "blue" },
  garbage: { icon: "delete", label: "Garbage", color: "amber" },
  pothole: { icon: "construction", label: "Pothole", color: "orange" },
  water: { icon: "water_drop", label: "Water", color: "cyan" },
  electricity: { icon: "bolt", label: "Electricity", color: "yellow" },
  other: { icon: "help", label: "Other", color: "slate" },
};

const STATUS_FLOW = ["Submitted", "In Progress", "Resolved"];

export default function ComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("nm_name");
    const phone = localStorage.getItem("nm_phone");
    if (!name || !phone) {
      router.push("/");
      return;
    }
    setUserName(name);
    fetchComplaints(phone);
  }, [router]);

  const fetchComplaints = async (phone) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/complaints?phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      if (data.complaints) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const simulateProgress = async (complaintIdx) => {
    const complaint = complaints[complaintIdx];
    const currentStatusIdx = STATUS_FLOW.indexOf(complaint.status);
    if (currentStatusIdx >= STATUS_FLOW.length - 1) return;

    const nextStatus = STATUS_FLOW[currentStatusIdx + 1];
    const updated = [...complaints];
    updated[complaintIdx] = { ...complaint, status: nextStatus };
    setComplaints(updated);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const getCategoryConfig = (category) => {
    return CATEGORY_CONFIG[category?.toLowerCase()] || CATEGORY_CONFIG.other;
  };

  const getCategoryColors = (color) => {
    const colorMap = {
      blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
      orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
      cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100" },
      yellow: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-100" },
      slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100" },
    };
    return colorMap[color] || colorMap.slate;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <Link
            href="/chat"
            className="p-2 hover:bg-blue-50 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-blue-800">
              arrow_back
            </span>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-[family-name:var(--font-headline)] text-lg font-bold text-blue-800 tracking-tight leading-tight">
              My Complaints
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              Track your filed civic complaints
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-800 p-2">
            shield
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mt-16 pb-32 px-4 max-w-2xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="py-6 flex flex-col gap-1">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-extrabold text-slate-900">
            Active Issues
          </h2>
          <p className="text-sm text-slate-600">
            {loading
              ? "Loading your complaints..."
              : complaints.length > 0
                ? `You have ${complaints.length} complaint${complaints.length > 1 ? "s" : ""} currently being tracked.`
                : "No complaints filed yet."}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-5 animate-pulse"
              >
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 w-full bg-slate-100 rounded mt-3" />
                <div className="h-4 w-3/4 bg-slate-100 rounded mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-3">
              error
            </span>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => {
                const phone = localStorage.getItem("nm_phone");
                if (phone) fetchComplaints(phone);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && complaints.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center mt-4">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 block">
              inbox
            </span>
            <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-slate-700 mb-2">
              No Complaints Yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Chat with Nagrik Mitra to report civic issues in your area!
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-800 transition-all active:scale-95"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                smart_toy
              </span>
              Start Chatting
            </Link>
          </div>
        )}

        {/* Complaints List */}
        {!loading && complaints.length > 0 && (
          <div className="space-y-4">
            {complaints.map((complaint, idx) => {
              const statusCfg =
                STATUS_CONFIG[complaint.status] || STATUS_CONFIG.Submitted;
              const catCfg = getCategoryConfig(complaint.category);
              const catColors = getCategoryColors(catCfg.color);
              const isResolved = complaint.status === "Resolved";

              return (
                <div
                  key={complaint.id || idx}
                  className={`glass-card rounded-xl p-5 shadow-sm border border-white hover:shadow-md transition-shadow animate-fade-in-up ${isResolved ? "opacity-80 hover:opacity-100 transition-opacity" : ""}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {/* ID + Status */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase ${isResolved ? "line-through" : ""}`}
                    >
                      {complaint.complaintId || "NM-XXXXX"}
                    </span>
                    <span
                      className={`${statusCfg.bg} ${statusCfg.text} text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`flex items-center gap-1.5 ${catColors.bg} ${catColors.text} px-2.5 py-1 rounded-lg border ${catColors.border}`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {catCfg.icon}
                      </span>
                      <span className="text-xs font-semibold">
                        {catCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <p
                    className={`font-medium leading-relaxed mb-4 ${isResolved ? "text-slate-500 line-through" : "text-slate-800"}`}
                  >
                    {complaint.summary}
                  </p>

                  {/* Location + Date */}
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <span className="material-symbols-outlined text-sm">
                        location_on
                      </span>
                      <span>{complaint.location || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-sm">
                        calendar_month
                      </span>
                      <span>Filed on {formatDate(complaint.createdAt)}</span>
                    </div>
                  </div>

                  {/* Simulate Progress Button */}
                  {complaint.status !== "Resolved" && (
                    <div className="pt-4 border-t border-slate-50">
                      <button
                        onClick={() => simulateProgress(idx)}
                        className="w-full py-2.5 px-4 border border-blue-200 text-blue-700 font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors active:scale-[0.98] cursor-pointer"
                      >
                        Simulate Progress
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empowering Citizens Card */}
        {!loading && complaints.length > 0 && (
          <div className="mt-10 p-6 bg-blue-900 rounded-2xl text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg mb-1">
                Empowering Citizens
              </h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                Your reports help improve our city one block at a time. Thank you
                for your active participation.
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-800 rounded-full blur-3xl opacity-50" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20" />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-white rounded-t-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-blue-50">
        <div className="flex justify-center items-center h-20 px-6">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 w-full max-w-xs bg-blue-800 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              smart_toy
            </span>
            <span>Back to Chat</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
