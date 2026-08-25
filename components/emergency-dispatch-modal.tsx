"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Phone,
  User,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PhoneNumber10DigitSchema } from "@/schemas/incident";

export type AlertChannelType = "telegram" | "email" | "sms";

export interface EmergencyDispatchModalProps {
  isOpen: boolean;
  lat: number;
  lng: number;
  initialName?: string;
  onClose: () => void; // Cancel / False Alarm
  onDispatch: (payload: {
    name: string;
    channel: AlertChannelType;
    channelData: {
      recipient?: string;
    };
  }) => Promise<{ success: boolean; error?: string }>;
  isDispatching: boolean;
}

export function EmergencyDispatchModal({
  isOpen,
  lat,
  lng,
  initialName = "",
  onClose,
  onDispatch,
  isDispatching,
}: EmergencyDispatchModalProps) {
  const [driverName, setDriverName] = useState(initialName);

  // Single active channel selector: "telegram" | "email" | "sms" (default to "sms")
  const [activeChannel, setActiveChannel] = useState<AlertChannelType>("sms");

  // Email input
  const [emailRecipient, setEmailRecipient] = useState("");

  // SMS phone number input (10-digit format without +91 prefix)
  const [smsRecipient, setSmsRecipient] = useState("");

  // Telegram configured status (checked from server env)
  const [isTelegramConfigured, setIsTelegramConfigured] = useState<boolean | null>(null);

  // Error state (persists so user can switch channel and retry)
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Auto-fetch Telegram config status on open
  useEffect(() => {
    if (!isOpen) return;

    async function syncBotInfo() {
      try {
        const res = await fetch("/api/telegram/sync-chat");
        const data = await res.json();
        setIsTelegramConfigured(!!data.configuredChatId);
      } catch {
        setIsTelegramConfigured(false);
      }
    }

    syncBotInfo();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchError(null);

    if (activeChannel === "telegram" && isTelegramConfigured === false) {
      setDispatchError(
        "TELEGRAM_ALERT_CHAT_ID is not configured. Add it to your .env.local and restart the server."
      );
      return;
    }

    if (
      activeChannel === "email" &&
      (!emailRecipient.trim() || !emailRecipient.includes("@"))
    ) {
      setDispatchError("Please enter a valid recipient email address.");
      return;
    }

    if (activeChannel === "sms") {
      const parsedPhone = PhoneNumber10DigitSchema.safeParse(smsRecipient);
      if (!parsedPhone.success) {
        setDispatchError(
          parsedPhone.error.issues[0]?.message ||
            "Please enter a valid 10-digit mobile number."
        );
        return;
      }
    }

    const res = await onDispatch({
      name: driverName.trim(),
      channel: activeChannel,
      channelData: {
        recipient:
          activeChannel === "email"
            ? emailRecipient.trim()
            : activeChannel === "sms"
            ? smsRecipient.trim()
            : undefined,
      },
    });

    if (!res.success && res.error) {
      setDispatchError(res.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-[500px] my-auto rounded-3xl bg-[#111111] border border-white/[0.08] shadow-2xl p-6 text-[#EDEDED] flex flex-col gap-5 relative animate-modal-pop"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08), 0 24px 64px -12px rgba(0,0,0,0.95)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-semibold text-[#EDEDED] tracking-tight">
              Emergency Dispatch Console
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-[#A1A1A1]">
              <MapPin className="w-3.5 h-3.5 text-[#EDEDED]" />
              <span className="font-mono text-[#EDEDED]">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#1F1F1F] text-[#A1A1A1] border border-white/[0.06]">
                Confirmed Tag
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDispatching}
            className="p-1.5 rounded-full text-[#A1A1A1] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
            title="Cancel and dismiss (False Alarm)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Driver Identifier (Optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono uppercase text-[#A1A1A1] tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3 text-[#A1A1A1]" />
              <span>Victim / Driver Identifier (Optional)</span>
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. John Doe / Vehicle #MH-12-AB-1234"
              className="h-10 px-3.5 rounded-2xl bg-[#1A1A1A] border border-white/[0.08] text-[13px] text-[#EDEDED] placeholder-[#6E6E6E] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
              disabled={isDispatching}
            />
          </div>

          {/* Single Channel Selector Tabs */}
          <div className="flex flex-col gap-2 pt-1">
            <label className="text-[11px] font-mono uppercase text-[#A1A1A1] tracking-wider">
              Select Alert Method (Choose One)
            </label>

            {/* Segmented Radio Tab Bar — 3 columns */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#1A1A1A] border border-white/[0.06]">
              {/* Telegram Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveChannel("telegram");
                  setDispatchError(null);
                }}
                className={`h-9 px-2 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeChannel === "telegram"
                    ? "bg-[#282828] text-white shadow-sm border border-white/[0.1]"
                    : "text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#202020]"
                }`}
                disabled={isDispatching}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              {/* Email Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveChannel("email");
                  setDispatchError(null);
                }}
                className={`h-9 px-2 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeChannel === "email"
                    ? "bg-[#282828] text-white shadow-sm border border-white/[0.1]"
                    : "text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#202020]"
                }`}
                disabled={isDispatching}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              {/* SMS Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveChannel("sms");
                  setDispatchError(null);
                }}
                className={`h-9 px-2 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeChannel === "sms"
                    ? "bg-[#282828] text-white shadow-sm border border-white/[0.1]"
                    : "text-[#A1A1A1] hover:text-[#EDEDED] hover:bg-[#202020]"
                }`}
                disabled={isDispatching}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>
            </div>
          </div>

          {/* Active Channel Configuration Card */}
          <div className="rounded-2xl bg-[#161616] p-4 border border-white/[0.06] flex flex-col gap-3">
            {/* OPTION 1: Telegram */}
            {activeChannel === "telegram" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-[#EDEDED] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#EDEDED]" />
                    <span>Telegram Bot Emergency Dispatch</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A1A1A1]">
                    Bot API
                  </span>
                </div>

                {/* Configured recipient status */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111111] border border-white/[0.05]">
                  {isTelegramConfigured === null ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A1A1A1] shrink-0" />
                  ) : isTelegramConfigured ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="text-[12px] text-[#A1A1A1]">
                    {isTelegramConfigured === null
                      ? "Checking configuration..."
                      : isTelegramConfigured
                      ? "Alert recipient configured via TELEGRAM_ALERT_CHAT_ID"
                      : "TELEGRAM_ALERT_CHAT_ID not set — add to .env.local"}
                  </span>
                </div>
              </div>
            )}

            {/* OPTION 2: Email */}
            {activeChannel === "email" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-[#EDEDED] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#EDEDED]" />
                    <span>Emergency Collision Email (SMTP)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A1A1A1]">
                    SMTP
                  </span>
                </div>
                <p className="text-[12px] text-[#A1A1A1] leading-relaxed">
                  Sends a formatted emergency report with map link directly to the emergency email inbox.
                </p>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="Recipient Email (e.g. emergency@hospital.org)"
                  className="h-10 px-3.5 rounded-xl bg-[#111111] border border-white/[0.08] text-[13px] text-[#EDEDED] placeholder-[#6E6E6E] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all"
                  disabled={isDispatching}
                  autoFocus
                />
              </div>
            )}

            {/* OPTION 3: SMS */}
            {activeChannel === "sms" && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-medium text-[#EDEDED] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#EDEDED]" />
                    <span>SMS Alert (TextBee)</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A1A1A1]">
                    TextBee
                  </span>
                </div>
                <p className="text-[12px] text-[#A1A1A1] leading-relaxed">
                  Sends a compact plain-text emergency SMS with GPS coordinates and a Google Maps link.
                </p>

                {/* Fixed +91 Prefix Input Container */}
                <div className="flex items-center rounded-xl bg-[#111111] border border-white/[0.08] focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 transition-all overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-[#1A1A1A] border-r border-white/[0.08] text-[#EDEDED] font-mono text-[13px] font-semibold select-none flex items-center gap-1.5 shrink-0">
                    <span className="text-[12px]">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={smsRecipient}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setSmsRecipient(val);
                    }}
                    placeholder="9876543210"
                    className="flex-1 h-10 px-3.5 bg-transparent font-mono text-[13px] text-[#EDEDED] placeholder-[#6E6E6E] focus:outline-none"
                    disabled={isDispatching}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6E6E6E] font-mono">
                  <span>Country code fixed to +91 (India)</span>
                  <span>{smsRecipient.length}/10 digits</span>
                </div>
              </div>
            )}
          </div>

          {/* Dispatch Error Notification */}
          {dispatchError && (
            <div className="p-3.5 rounded-2xl bg-[#1F1F1F] border border-white/[0.12] text-[12px] text-[#EDEDED] flex flex-col gap-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-[#EDEDED] shrink-0" />
                <span>Alert dispatch failed on this channel</span>
              </div>
              <div className="text-[#A1A1A1] font-mono text-[11px] pl-6">
                {dispatchError}
              </div>
              <div className="text-[11px] text-[#EDEDED]/80 pl-6 pt-1 font-sans">
                💡 Try switching to another alert tab (Telegram, Email, or SMS) and click Dispatch again.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDispatching}
              className="flex-1 h-11 rounded-2xl bg-[#1A1A1A] hover:bg-[#222222] text-[#A1A1A1] hover:text-[#EDEDED] text-[13px] font-medium transition-all border border-white/[0.08] cursor-pointer disabled:opacity-50"
            >
              False Alarm (Cancel)
            </button>

            <button
              type="submit"
              disabled={isDispatching}
              className="flex-1 h-11 rounded-2xl bg-[#EDEDED] hover:bg-white text-[#0A0A0A] text-[13px] font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                  <span>Dispatching Alert...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#0A0A0A]" />
                  <span>Dispatch &amp; Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
