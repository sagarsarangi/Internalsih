"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIncidentStore } from "@/store/incident-store";
import { AlertTriangle, Loader2 } from "lucide-react";

// Dynamically import AccidentMap with SSR disabled (MapLibre requires browser environment)
const AccidentMap = dynamic(() => import("@/components/AccidentMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0A0A0A] text-[#A1A1A1] text-[14px]">
      <div className="flex items-center gap-2.5">
        <Loader2 className="w-5 h-5 text-[#3291FF] animate-spin" />
        <span>Initializing telemetry map engine...</span>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const error = useIncidentStore((state) => state.error);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A0A0A] text-[#EDEDED] overflow-hidden select-none selection:bg-[#3291FF]/30">
      {/* Global Error Notice if Database Connection / Fetch fails */}
      {error && (
        <div className="bg-[#1A1A1A] border-b border-[#F1616B]/30 px-6 py-2.5 text-[13px] text-[#EDEDED] flex items-center justify-between z-30">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F1616B] shrink-0" />
            <span>Notice: {error}</span>
          </div>
          <span className="text-[11px] text-[#A1A1A1] font-mono">
            Check Supabase configuration in .env.local
          </span>
        </div>
      )}

      {/* Main Full-Height Map Container */}
      <main className="flex-1 w-full h-full relative flex flex-col min-h-0">
        <AccidentMap
          isAdmin={true}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </main>
    </div>
  );
}

