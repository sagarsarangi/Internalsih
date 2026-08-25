"use client";

import Link from "next/link";
import {
  ArrowRight,
  Activity,
  CheckCircle2,
  Terminal,
  ChevronDown,
  Radio,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { LoginManager } from "@/components/login-manager";

export default function LandingPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] flex flex-col selection:bg-[#3291FF]/30 relative">
      {/* Precision coordinate grid across the entire landing page */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-grid-subtle"
      />

      <Suspense fallback={null}>
        <LoginManager />
      </Suspense>

      {/* Main Content Area: All Unified on One Page */}
      <main className="flex-1 w-full flex flex-col items-center relative z-10">
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: FULLY CENTERED IN VIEWPORT */}
        {/* ========================================================================= */}
        <section className="min-h-screen w-full max-w-[1200px] mx-auto px-6 flex flex-col items-center justify-center text-center py-16 relative">
          {/* Hero H1 */}
          <h1 className="font-semibold text-[#EDEDED] max-w-[780px] text-4xl sm:text-5xl md:text-[56px] leading-[1.08] tracking-[-2.5px] mb-5">
            Smart Helmet: IoT Accident Detection &amp; Rider Safety
          </h1>

          {/* Subhead */}
          <p className="font-normal text-[#A1A1A1] max-w-[580px] text-[16px] sm:text-[18px] leading-[1.6] mb-8">
            Low-cost IoT smart helmet embedded with motion impact detection, real-time GPS coordinates, automated emergency SMS alert dispatch, and a manual false-alarm cancel guard.
          </p>

          {/* Single Direct Action Button */}
          <div className="flex items-center justify-center mb-12">
            <Link
              href="/dashboard"
              prefetch={false}
              className="h-11 px-7 flex items-center justify-center gap-2 text-[14px] font-medium bg-[#EDEDED] text-[#0A0A0A] hover:bg-[#FFFFFF] rounded-full transition-all focus-ring shadow-md active:scale-[0.98]"
            >
              <span>Open Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bottom subtle scroll anchor */}
          <button
            type="button"
            onClick={() => scrollToSection("geocoding-section")}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#6E6E6E] hover:text-[#A1A1A1] transition-colors pt-4 cursor-pointer focus:outline-none rounded-full px-3 py-1"
          >
            <span>Explore System Architecture</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 2. SECTION 1 (Left to Right): TEXT ON LEFT, VISUAL ON RIGHT */}
        {/* ========================================================================= */}
        <section
          id="geocoding-section"
          className="w-full border-t border-white/[0.08] py-24 sm:py-32"
        >
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text */}
            <div className="space-y-6">
              <Badge variant="default" className="text-[11px] uppercase tracking-wider rounded-full px-3 py-0.5">
                01 / Impact Telemetry &amp; Safety Window
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDEDED] leading-[1.2]">
                Instant impact detection, GPS tagging, and false-alarm guard
              </h2>
              <p className="text-[16px] text-[#A1A1A1] leading-relaxed">
                When crash-level impact is detected by the helmet&apos;s accelerometer and gyroscope, GPS coordinates are immediately captured and paired with an emergency confirmation window before dispatch.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#3291FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3291FF]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      10-Second False-Alarm Cancel Button
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Riders can abort accidental triggers immediately before any SMS dispatch or database persistence occurs.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#3291FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#3291FF]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      Non-Blocking Location Fallback
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Resolves street address via geocoding while ensuring raw GPS coordinates are immediately ready for transmission.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Code/Telemetry Visual */}
            <div
              className="rounded-3xl overflow-hidden bg-[#111111] border border-white/[0.08]"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.6)",
              }}
            >
              <div className="h-11 px-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F1616B]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFA057]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4CC38A]/80" />
                </div>
                <div className="text-[11px] font-mono text-[#6E6E6E] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#3291FF]" />
                  <span>reverse-geocode.json</span>
                </div>
                <div className="w-10" />
              </div>
              <div className="p-6 font-mono text-[12px] sm:text-[13px] leading-relaxed text-[#EDEDED] overflow-x-auto bg-[#0E0E0E]">
                <div className="text-[#6E6E6E] mb-2">{`// POST /api/simulate-accident`}</div>
                <div><span className="text-[#3291FF]">&ldquo;lat&rdquo;</span>: <span className="text-[#FFA057]">28.61393</span>,</div>
                <div><span className="text-[#3291FF]">&ldquo;lng&rdquo;</span>: <span className="text-[#FFA057]">77.20902</span>,</div>
                <div><span className="text-[#3291FF]">&ldquo;status&rdquo;</span>: <span className="text-[#4CC38A]">&ldquo;confirmed&rdquo;</span>,</div>
                <div><span className="text-[#3291FF]">&ldquo;occurred_at&rdquo;</span>: <span className="text-[#EDEDED]">&ldquo;2026-08-25T01:33:50Z&rdquo;</span>,</div>
                <div><span className="text-[#3291FF]">&ldquo;address&rdquo;</span>: <span className="text-[#EDEDED]">&ldquo;Rajpath Area, Central Secretariat, New Delhi&rdquo;</span>,</div>
                <div><span className="text-[#3291FF]">&ldquo;geocoded_by&rdquo;</span>: <span className="text-[#A1A1A1]">&ldquo;LocationIQ API (Sub-50ms)&rdquo;</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. SECTION 2 (Right to Left): VISUAL ON LEFT, TEXT ON RIGHT */}
        {/* ========================================================================= */}
        <section
          id="realtime-section"
          className="w-full border-t border-white/[0.08] py-24 sm:py-32"
        >
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Live Sync Stream Visual */}
            <div
              className="rounded-3xl overflow-hidden bg-[#111111] border border-white/[0.08] order-2 lg:order-1"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.6)",
              }}
            >
              <div className="h-11 px-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4CC38A]" />
                  <span className="text-[11px] font-mono text-[#EDEDED]">WebSocket Subscription</span>
                </div>
                <span className="text-[11px] font-mono text-[#6E6E6E]">supabase_realtime</span>
              </div>
              <div className="p-6 space-y-3 bg-[#0C0C0C]">
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-[#4CC38A]" />
                    <div>
                      <div className="text-[13px] font-medium text-[#EDEDED]">Terminal Alpha (HQ)</div>
                      <div className="text-[11px] text-[#A1A1A1]">INSERT event received &middot; 14ms</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] rounded-full px-2">SYNCED</Badge>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Radio className="w-4 h-4 text-[#4CC38A]" />
                    <div>
                      <div className="text-[13px] font-medium text-[#EDEDED]">Terminal Beta (Field Unit)</div>
                      <div className="text-[11px] text-[#A1A1A1]">INSERT event received &middot; 22ms</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] rounded-full px-2">SYNCED</Badge>
                </div>

                <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-[#3291FF]" />
                    <div>
                      <div className="text-[13px] font-medium text-[#EDEDED]">Deduplication Filter</div>
                      <div className="text-[11px] text-[#A1A1A1]">UUID Hash Match Verified</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] rounded-full px-2">VERIFIED</Badge>
                </div>
              </div>
            </div>

            {/* Right Column: Text */}
            <div className="space-y-6 order-1 lg:order-2">
              <Badge variant="default" className="text-[11px] uppercase tracking-wider rounded-full px-3 py-0.5">
                02 / Live Telemetry &amp; Field Monitoring
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDEDED] leading-[1.2]">
                Real-time map sync for emergency dispatchers &amp; family
              </h2>
              <p className="text-[16px] text-[#A1A1A1] leading-relaxed">
                Every connected monitoring terminal and emergency contact console receives instant crash telemetry. When an incident occurs on the road, map markers update live across all open sessions simultaneously via Supabase Realtime.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#4CC38A]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4CC38A]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      Postgres Changefeeds
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Direct database triggers push new accident rows over lightweight WebSocket frames.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#4CC38A]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#4CC38A]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      State Deduplication
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Local Zustand store automatically deduplicates IDs to prevent duplicate markers on rapid updates.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SECTION 3 (Left to Right): TEXT ON LEFT, VISUAL ON RIGHT */}
        {/* ========================================================================= */}
        <section
          id="dispatch-section"
          className="w-full border-t border-white/[0.08] py-24 sm:py-32"
        >
          <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text */}
            <div className="space-y-6">
              <Badge variant="default" className="text-[11px] uppercase tracking-wider rounded-full px-3 py-0.5">
                03 / Automated Emergency Dispatch
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDEDED] leading-[1.2]">
                Automated cellular SMS alerting &amp; verified persistence
              </h2>
              <p className="text-[16px] text-[#A1A1A1] leading-relaxed">
                Confirmed crash events immediately fire location-tagged emergency SMS alerts (+91) with Google Maps navigation links to pre-set emergency contacts and response teams, backed by multi-channel Telegram/Email fallback.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#FFA057]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FFA057]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      Verified Dispatch Gate
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Incidents are persisted and broadcast across dashboards only upon verified emergency alert delivery.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-[#FFA057]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[#FFA057]" />
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-[#EDEDED]">
                      Edge-Guarded Security
                    </div>
                    <div className="text-[13px] text-[#A1A1A1]">
                      Single-operator credentials verified via Edge JWT session cookies with strict RLS isolation.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Dispatch Feed Visual */}
            <div
              className="rounded-3xl overflow-hidden bg-[#111111] border border-white/[0.08]"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.6)",
              }}
            >
              <div className="h-11 px-5 border-b border-white/[0.08] flex items-center justify-between bg-[#141414]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#FFA057]" />
                  <span className="text-[11px] font-mono text-[#EDEDED]">Cellular SMS Dispatch Log</span>
                </div>
                <Badge variant="outline" className="text-[10px] rounded-full px-2">TextBee Gateway</Badge>
              </div>
              <div className="p-6 font-mono text-[12px] sm:text-[13px] leading-relaxed text-[#EDEDED] space-y-3 bg-[#0E0E0E]">
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/[0.08] border-l-4 border-l-[#4CC38A]">
                  <div className="text-[11px] text-[#6E6E6E]">{`// Emergency SMS Alert (+919876543210)`}</div>
                  <div className="text-[#EDEDED] mt-1.5 leading-relaxed">
                    &ldquo;🚨 EMERGENCY ALERT: Crash detected for Rider at Rajpath Area (28.6139, 77.2090). Live location: https://maps.google.com/?q=28.61393,77.20902&rdquo;
                  </div>
                  <div className="text-[11px] text-[#4CC38A] mt-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HTTP 201 Created &middot; SMS Alert Delivered &middot; Row Persisted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Engineering Footer */}
      <footer
        className="w-full py-8 text-center text-[12px] text-[#6E6E6E] border-t border-white/[0.08] relative z-10"
      >
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4CC38A]" />
            <span>Smart Helmet (PS-06) &middot; Low-Cost IoT Accident Detection &amp; Rider Safety</span>
          </div>
          <div>Next.js &middot; MapLibre GL &middot; Supabase Realtime</div>
        </div>
      </footer>
    </div>
  );
}
