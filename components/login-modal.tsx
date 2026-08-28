"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, X } from "lucide-react";
import { getDemoCredentials } from "@/app/actions/auth";

export function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [defaultCreds, setDefaultCreds] = useState({ user: "", pass: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dynamic defaults from server action
  useEffect(() => {
    getDemoCredentials().then((creds) => {
      setUsername(creds.username);
      setPassword(creds.password);
      setDefaultCreds({ user: creds.username, pass: creds.password });
    });
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password");
        setIsSubmitting(false);
        return;
      }

      // Success: Route to dashboard
      window.location.href = "/dashboard";
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
      {/* Clean Dark Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A0A0A]/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card with Rounder Corners and Pop-in Animation */}
      <div
        className="relative w-full max-w-[400px] bg-[#111111] border border-white/[0.08] rounded-[28px] p-6 sm:p-8 shadow-2xl animate-modal-pop my-auto"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px -12px rgba(0,0,0,0.95)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-[#A1A1A1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Header */}
        <div className="mb-7 flex flex-col items-center text-center mt-1">
          <h1 className="text-[24px] font-semibold text-white tracking-[-1.28px]">
            Log in
          </h1>
          <p className="text-[14px] text-[#A1A1A1] mt-1.5 leading-relaxed">
            Enter your credentials to access the admin dashboard.
            {defaultCreds.user && (
              <>
                <br />
                <span className="text-[12px] mt-1 inline-block opacity-80">
                  Default: <strong className="text-white font-medium">{defaultCreds.user}</strong> / <strong className="text-white font-medium">{defaultCreds.pass}</strong>
                </span>
              </>
            )}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mb-5 p-3 rounded-2xl bg-[#1A1A1A] border border-[#F1616B]/40 flex items-center gap-2.5 text-[13px] text-[#EDEDED]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#F1616B]" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[13px] font-medium text-[#EDEDED] mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={defaultCreds.user || "admin"}
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A1A1A] text-white text-[14px] placeholder-[#6E6E6E] border border-white/[0.08] focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-[#EDEDED] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-11 px-3.5 rounded-2xl bg-[#1A1A1A] text-white text-[14px] placeholder-[#6E6E6E] border border-white/[0.08] focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-2xl bg-white text-[#0A0A0A] hover:bg-[#EDEDED] active:scale-[0.98] font-medium text-[14px] transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
              ) : (
                "Log in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
