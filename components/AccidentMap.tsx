"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import {
  Compass,
  Map as MapIcon,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Loader2,
  Activity,
  Layers,
  LogOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Trash2,
} from "lucide-react";
import { useIncidentStore } from "@/store/incident-store";
import { usePendingTagStore } from "@/store/pending-tag-store";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Incident } from "@/schemas/incident";
import type { TelegramDispatchResult } from "@/lib/telegram";
import type { EmergencyEmailDispatchResult } from "@/lib/email";
import type { SmsDispatchResult } from "@/lib/sms";
import { Badge } from "@/components/ui/badge";
import {
  EmergencyDispatchModal,
  AlertChannelType,
} from "@/components/emergency-dispatch-modal";

interface AccidentMapProps {
  isAdmin?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export type MapStyleKey = "osm" | "voyager" | "positron" | "dark";

export const MAP_STYLES: Record<
  MapStyleKey,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    style: maplibregl.StyleSpecification;
  }
> = {
  osm: {
    label: "OSM Standard",
    description: "Standard OpenStreetMap tiles",
    icon: Compass,
    style: {
      version: 8,
      sources: {
        "osm-standard": {
          type: "raster",
          tiles: [
            "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        },
      },
      layers: [
        {
          id: "osm-tiles",
          type: "raster",
          source: "osm-standard",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
  voyager: {
    label: "Streets (Voyager)",
    description: "High-contrast road network",
    icon: MapIcon,
    style: {
      version: 8,
      sources: {
        "carto-voyager": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        },
      },
      layers: [
        {
          id: "voyager-tiles",
          type: "raster",
          source: "carto-voyager",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  positron: {
    label: "Clean Light",
    description: "Minimalist grayscale canvas",
    icon: Sun,
    style: {
      version: 8,
      sources: {
        "carto-positron": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
            "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        },
      },
      layers: [
        {
          id: "positron-tiles",
          type: "raster",
          source: "carto-positron",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  dark: {
    label: "Dark Tactical",
    description: "Low-light night operations",
    icon: Moon,
    style: {
      version: 8,
      sources: {
        "carto-dark": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        },
      },
      layers: [
        {
          id: "dark-tiles",
          type: "raster",
          source: "carto-dark",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
};

interface NotificationToast {
  id?: string;
  type: "success" | "error";
  title: string;
  address?: string | null;
  lat?: number;
  lng?: number;
  telegram?: TelegramDispatchResult | null;
  email?: EmergencyEmailDispatchResult | null;
  sms?: SmsDispatchResult | null;
  details?: string;
}

export default function AccidentMap({
  isAdmin = false,
  onLogout,
  isLoggingOut: externalIsLoggingOut,
}: AccidentMapProps) {
  const router = useRouter();
  const [internalIsLoggingOut, setInternalIsLoggingOut] = useState(false);
  const isLoggingOut = externalIsLoggingOut ?? internalIsLoggingOut;

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    setInternalIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setInternalIsLoggingOut(false);
    }
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Default to OSM Standard
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>("osm");
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  // Zustand Store States
  const incidents = useIncidentStore((state) => state.incidents);
  const setIncidents = useIncidentStore((state) => state.setIncidents);
  const setLoading = useIncidentStore((state) => state.setLoading);
  const setError = useIncidentStore((state) => state.setError);
  const isLoading = useIncidentStore((state) => state.isLoading);

  const pendingTag = usePendingTagStore((state) => state.pendingTag);
  const clearPendingTag = usePendingTagStore((state) => state.clearPendingTag);

  // Countdown & Modal confirmation state
  const [countdown, setCountdown] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Success / Dispatch Notification Toast state
  const [toast, setToast] = useState<NotificationToast | null>(null);

  // Incidents List Side Panel State
  const [isListOpen, setIsListOpen] = useState(false);

  // Manual Simulation Coordinates
  const [simulateLat, setSimulateLat] = useState<string>("");
  const [simulateLng, setSimulateLng] = useState<string>("");

  const handleManualSimulate = () => {
    const latStr = simulateLat.trim();
    const lngStr = simulateLng.trim();

    if (!latStr || !lngStr) {
      setToast({
        type: "error",
        title: "Missing Coordinates",
        details: "Please enter both latitude and longitude.",
      });
      return;
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    
    if (isNaN(lat) || isNaN(lng)) {
      setToast({
        type: "error",
        title: "Invalid Format",
        details: "Coordinates must be valid decimal numbers.",
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      setToast({
        type: "error",
        title: "Invalid Latitude",
        details: "Latitude must be between -90 and 90 degrees.",
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      setToast({
        type: "error",
        title: "Invalid Longitude",
        details: "Longitude must be between -180 and 180 degrees.",
      });
      return;
    }
    
    usePendingTagStore.getState().setPendingTag({
      lat,
      lng,
      name: "",
      contact: "",
    });

    setSimulateLat("");
    setSimulateLng("");
  };

  // Focus / Fit bounds to all incidents
  const fitToIncidents = useCallback(() => {
    const map = mapRef.current;
    if (!map || incidents.length === 0) return;

    if (incidents.length === 1) {
      map.flyTo({
        center: [incidents[0].lng, incidents[0].lat],
        zoom: 14,
        essential: true,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    incidents.forEach((inc) => bounds.extend([inc.lng, inc.lat]));
    map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
  }, [incidents]);

  const handleDeleteIncident = useCallback(async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to completely delete this accident history from the database? This cannot be undone.")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/incidents?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete incident");
      }
      useIncidentStore.getState().removeIncident(id);
      const toastId = `delete-${id}`;
      setToast({
        id: toastId,
        type: "success",
        title: "Incident Deleted",
        details: "The accident history was successfully removed from the project.",
      });
      setTimeout(() => {
        setToast((prev) => (prev?.id === toastId ? null : prev));
      }, 5000);
    } catch (err: any) {
      setToast({
        type: "error",
        title: "Delete Failed",
        details: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, setLoading]);

  // Sync Confirmed Markers Helper
  const syncMarkers = useCallback((currentIncidents: Incident[]) => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(currentIncidents.map((inc) => inc.id));

    // Remove deleted markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.getPopup()?.remove();
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add new markers
    currentIncidents.forEach((incident) => {
      if (markersRef.current.has(incident.id)) {
        return;
      }

      const el = document.createElement("div");
      el.className = "accident-marker group cursor-pointer";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full bg-[#EDEDED] border-2 border-[#0A0A0A] shadow-xl flex items-center justify-center transition-transform group-hover:scale-125">
            <div class="w-2 h-2 rounded-full bg-[#0A0A0A]"></div>
          </div>
        </div>
      `;

      const dateFormatted = incident.occurred_at
        ? new Date(incident.occurred_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "Unknown time";

      const channelItems: string[] = [];
      const tgVal = incident.telegram || incident.telegram_chat_id;
      const emailVal = incident.email || incident.email_recipient;
      const smsVal = incident.sms;

      if (tgVal) channelItems.push(`✈️ TG: ${tgVal}`);
      if (emailVal) channelItems.push(`✉️ Email: ${emailVal}`);
      if (smsVal) channelItems.push(`📱 SMS: ${smsVal}`);
      if (channelItems.length === 0 && incident.contact_number) {
        channelItems.push(`📞 ${incident.contact_number}`);
      }

      const contactDisplay =
        channelItems.length > 0 ? channelItems.join(" • ") : null;

      const escapeHtml = (unsafe: string) => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const safeVictimName = escapeHtml(incident.victim_name || "Unidentified");
      const safeAddress = escapeHtml(incident.address || "Coordinates recorded (Address unavailable)");
      const safeContactDisplay = contactDisplay ? escapeHtml(contactDisplay) : null;

      const victimInfo =
        safeVictimName !== "Unidentified" || safeContactDisplay
          ? `<div class="text-[11px] text-[#A1A1A1] pt-1.5 border-t border-white/[0.08] flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <span>👤 Identifier:</span>
                <span class="text-[#EDEDED] font-medium truncate">${safeVictimName}</span>
              </div>
              ${
                safeContactDisplay
                  ? `<div class="flex items-center justify-between gap-2">
                      <span>📡 Alert Sent:</span>
                      <span class="font-mono text-[#EDEDED] text-[10.5px] truncate">${safeContactDisplay}</span>
                    </div>`
                  : ""
              }
            </div>`
          : "";

      const popupHtml = `
        <div class="space-y-2 max-w-[280px] text-[#EDEDED] p-1">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono uppercase bg-white/10 text-white font-semibold border border-white/20">
              Confirmed Incident
            </span>
            <span class="text-[11px] text-[#A1A1A1] font-mono">
              ${incident.id.slice(0, 8)}
            </span>
          </div>
          <div class="text-[13px] font-medium text-[#EDEDED] leading-snug">
            ${safeAddress}
          </div>
          <div class="text-[11px] text-[#A1A1A1] flex items-center justify-between pt-1 border-t border-white/[0.1]">
            <span>${incident.lat.toFixed(5)}, ${incident.lng.toFixed(5)}</span>
            <span>${dateFormatted}</span>
          </div>
          ${victimInfo}
        </div>
      `;

      const popupContent = document.createElement("div");
      popupContent.innerHTML = popupHtml;

      if (isAdmin) {
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors border border-red-500/20 cursor-pointer";
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> Delete Incident`;
        deleteBtn.onclick = () => handleDeleteIncident(incident.id);
        popupContent.querySelector(".space-y-2")?.appendChild(deleteBtn);
      }

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        closeOnClick: false,
        className: "custom-map-popup",
      }).setDOMContent(popupContent);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([incident.lng, incident.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(incident.id, marker);
    });
  }, [isAdmin, handleDeleteIncident]);

  // Synchronize Pending Tag Marker on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!pendingTag) {
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }
      return;
    }

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.setLngLat([pendingTag.lng, pendingTag.lat]);
    } else {
      const el = document.createElement("div");
      el.className = "pending-marker cursor-pointer";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-[#EDEDED] border-2 border-[#111111] shadow-2xl flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-[#111111] animate-pulse"></div>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([pendingTag.lng, pendingTag.lat])
        .addTo(map);

      pendingMarkerRef.current = marker;
    }

    map.easeTo({ center: [pendingTag.lng, pendingTag.lat], duration: 400 });

    return () => {
      if (pendingMarkerRef.current) {
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }
    };
  }, [pendingTag]);

  // Handle Single Channel Alert Dispatch from Modal
  const handleDispatchFromModal = async (payloadData: {
    name: string;
    channel: AlertChannelType;
    channelData: {
      recipient?: string;
    };
  }): Promise<{ success: boolean; error?: string }> => {
    const currentTag = usePendingTagStore.getState().pendingTag;
    if (!currentTag) {
      return { success: false, error: "No active accident tag found." };
    }

    setIsDispatching(true);

    try {
      const payload = {
        lat: currentTag.lat,
        lng: currentTag.lng,
        timestamp: new Date(currentTag.taggedAt).toISOString(),
        name: payloadData.name || null,
        channels: {
          telegram: {
            enabled: payloadData.channel === "telegram",
          },
          email: {
            enabled: payloadData.channel === "email",
            recipient: payloadData.channelData.recipient || null,
          },
          sms: {
            enabled: payloadData.channel === "sms",
            recipient: payloadData.channelData.recipient || null,
          },
        },
      };

      const response = await fetch("/api/simulate-accident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => ({}));

      // If dispatch failed on this channel: do NOT close the modal, let user retry/switch channel!
      if (!response.ok) {
        const errorMsg =
          resData.details ||
          resData.error ||
          `Alert failed (Status ${response.status})`;

        return {
          success: false,
          error: errorMsg,
        };
      }

      const createdIncident: Incident = {
        id: resData.id,
        lat: resData.lat,
        lng: resData.lng,
        address: resData.address,
        occurred_at: resData.occurred_at,
        status: resData.status,
        victim_name: resData.victim_name,
        telegram: resData.telegram,
        email: resData.email,
        sms: resData.sms,
        contact_number: resData.contact_number,
        created_at: resData.created_at,
      };

      // Successful dispatch & DB persist: add to store, clear tag, close modal
      useIncidentStore.getState().addIncident(createdIncident);
      usePendingTagStore.getState().clearPendingTag();
      setIsModalOpen(false);

      // Show Clean Notification Toast
      setToast({
        id: createdIncident.id,
        type: "success",
        title: "Emergency Alert Dispatched & Incident Recorded",
        address: createdIncident.address,
        lat: createdIncident.lat,
        lng: createdIncident.lng,
        telegram: resData._telegram,
        email: resData._email,
        sms: resData._sms,
      });

      // Auto dismiss toast after 9 seconds
      setTimeout(() => {
        setToast((prev) => (prev?.id === createdIncident.id ? null : prev));
      }, 9000);

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setIsDispatching(false);
    }
  };

  // Branch A: False Alarm (Cancel tag without any network call)
  const handleFalseAlarm = () => {
    if (isDispatching) return;
    clearPendingTag();
    setIsModalOpen(false);
  };

  // 10-Second Countdown Effect: When 0, open Emergency Dispatch Modal
  useEffect(() => {
    if (!pendingTag || isModalOpen) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - pendingTag.taggedAt;
      const remainingSeconds = Math.max(0, (10000 - elapsed) / 1000);
      setCountdown(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setIsModalOpen(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pendingTag, isModalOpen]);

  // 1. Initialize MapLibre Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES.osm.style,
        center: [77.209, 28.6139],
        zoom: 12,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }),
        "bottom-right"
      );

      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: "© OpenStreetMap contributors",
        }),
        "bottom-left"
      );

      map.on("load", () => {
        map.resize();
        const stored = useIncidentStore.getState().incidents;
        syncMarkers(stored);

        if (stored.length > 0) {
          if (stored.length === 1) {
            map.flyTo({ center: [stored[0].lng, stored[0].lat], zoom: 14 });
          } else {
            const bounds = new maplibregl.LngLatBounds();
            stored.forEach((inc) => bounds.extend([inc.lng, inc.lat]));
            map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
          }
        }
      });

      // Admin Click-to-Tag Listener is removed. User must manually input lat/long.

      map.on("error", (e) => {
        console.warn("MapLibre event:", e);
      });

      mapRef.current = map;

      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      const handleWindowResize = () => map.resize();
      window.addEventListener("resize", handleWindowResize);
      const currentMarkers = markersRef.current;

      return () => {
        window.removeEventListener("resize", handleWindowResize);
        resizeObserver.disconnect();
        currentMarkers.forEach((marker) => marker.remove());
        currentMarkers.clear();
        if (pendingMarkerRef.current) {
          pendingMarkerRef.current.remove();
          pendingMarkerRef.current = null;
        }
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error("Failed to initialize MapLibre GL map:", err);
      setError("Unable to initialize WebGL map canvas.");
    }
  }, [isAdmin, setError, syncMarkers]);

  // Switch Map Style Handler
  const handleStyleChange = (styleKey: MapStyleKey) => {
    setActiveStyle(styleKey);
    setStyleMenuOpen(false);
    if (!mapRef.current) return;

    mapRef.current.setStyle(MAP_STYLES[styleKey].style);
    mapRef.current.once("style.load", () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      syncMarkers(useIncidentStore.getState().incidents);
    });
  };

  // 2. Fetch historical incidents on mount (Phase 1)
  useEffect(() => {
    let isMounted = true;

    async function fetchHistoricalIncidents() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/incidents");
        if (!res.ok) {
          throw new Error(`Failed to load incidents: ${res.statusText}`);
        }
        const data: Incident[] = await res.json();
        if (isMounted) {
          const currentIncidents = useIncidentStore.getState().incidents;
          const merged = [...data];
          currentIncidents.forEach((liveInc) => {
            if (!merged.some((d) => d.id === liveInc.id)) {
              merged.unshift(liveInc);
            }
          });
          // Sort merged by occurred_at descending
          merged.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
          
          setIncidents(merged);
          const map = mapRef.current;
          if (map && merged.length > 0) {
            if (merged.length === 1) {
              map.flyTo({ center: [merged[0].lng, merged[0].lat], zoom: 14 });
            } else {
              const bounds = new maplibregl.LngLatBounds();
              merged.forEach((inc) => bounds.extend([inc.lng, inc.lat]));
              map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching historical incidents:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load incidents"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHistoricalIncidents();

    return () => {
      isMounted = false;
    };
  }, [setIncidents, setLoading, setError]);

  // 3. Supabase Realtime live INSERT/DELETE subscription (Phase 2)
  useEffect(() => {
    const channel = supabaseBrowser
      .channel("public:incidents")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incidents",
        },
        (payload) => {
          if (payload.new) {
            const newIncident = payload.new as Incident;
            useIncidentStore.getState().addIncident(newIncident);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "incidents",
        },
        (payload) => {
          if (payload.old && payload.old.id) {
            useIncidentStore.getState().removeIncident(payload.old.id as string);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info("[Realtime] Subscribed to incidents live channel");
        }
      });

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  // 4. Synchronize incident markers when store updates
  useEffect(() => {
    syncMarkers(incidents);
  }, [incidents, syncMarkers]);

  const ActiveIcon = MAP_STYLES[activeStyle].icon;

  return (
    <div className="relative w-full h-full flex-1 min-h-0 min-w-0 bg-[#0A0A0A] overflow-hidden">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Top Left Controls: Tile Providers & Sign Out */}
      <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2.5">
        {/* Style Selector Dropdown Pill */}
        <div className="relative flex items-center gap-2.5">
          <button
            onClick={() => setStyleMenuOpen(!styleMenuOpen)}
            className="h-10 px-4 rounded-2xl bg-[#111111]/95 text-[#EDEDED] text-[13px] font-medium backdrop-blur-md flex items-center gap-2.5 hover:bg-[#1A1A1A] transition-all shadow-lg border border-white/[0.08] focus-ring cursor-pointer"
            title="Select Tile Layer"
          >
            <ActiveIcon className="w-4 h-4 text-[#EDEDED]" />
            <span>{MAP_STYLES[activeStyle].label}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#A1A1A1] transition-transform duration-200 ${
                styleMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Map Loading Overlay */}
          {isLoading && (
            <div className="h-10 px-4 rounded-2xl bg-[#111111]/90 backdrop-blur-md text-[12px] text-[#EDEDED] flex items-center gap-2 border border-white/[0.08] shadow-md">
              <Loader2 className="w-3.5 h-3.5 text-[#EDEDED] animate-spin" />
              <span>Loading telemetry...</span>
            </div>
          )}

          {styleMenuOpen && (
            <div
              className="absolute top-12 left-0 w-64 rounded-3xl bg-[#111111]/95 backdrop-blur-xl p-2 flex flex-col gap-1.5 z-30 shadow-2xl border border-white/[0.1]"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.8)",
              }}
            >
              <div className="px-3 py-1.5 text-[11px] font-medium text-[#6E6E6E] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Layers className="w-3 h-3" />
                <span>Tile Providers</span>
              </div>
              {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                const item = MAP_STYLES[key];
                const ItemIcon = item.icon;
                const isActive = activeStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStyleChange(key)}
                    className={`h-11 px-3 rounded-2xl text-left text-[13px] flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#282828] text-white font-medium shadow-sm border border-white/[0.1]"
                        : "text-[#EDEDED] hover:bg-[#1C1C1C]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-[#A1A1A1]"
                        }`}
                      />
                      <div>
                        <div className="leading-tight font-medium">{item.label}</div>
                        <div
                          className={`text-[10px] ${
                            isActive ? "text-white/80" : "text-[#6E6E6E]"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        {isAdmin && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-9 px-4 rounded-2xl bg-[#1A1A1A] hover:bg-[#262626] text-[#EDEDED] text-[13px] font-medium backdrop-blur-md flex items-center gap-2 transition-all shadow-lg border border-white/[0.08] focus-ring active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Sign out of Admin Console"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        )}
      </div>

      {/* Incident Counter & Focus Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsListOpen(!isListOpen)}
          className={`h-10 px-4 rounded-2xl bg-[#111111]/95 backdrop-blur-md text-[12px] text-[#EDEDED] flex items-center gap-3 border border-white/[0.08] shadow-lg transition-all cursor-pointer focus-ring ${isListOpen ? "bg-[#1A1A1A]" : "hover:bg-[#1A1A1A]"}`}
          title="Toggle active incidents list"
        >
          <Badge variant="outline" className="px-2 py-0.5 h-5 rounded-full border-white/20 text-white">
            <Activity className="w-3 h-3 text-white" />
            <span>LIVE</span>
          </Badge>
          <span className="font-mono font-semibold">{incidents.length}</span>
          <span className="text-[#A1A1A1]">
            {incidents.length === 1 ? "Incident" : "Incidents"}
          </span>
          {incidents.length > 0 && (
            <ChevronDown className={`w-3.5 h-3.5 text-white ml-0.5 transition-transform duration-200 ${isListOpen ? "rotate-180" : ""}`} />
          )}
        </button>
      </div>

      {/* Incidents List Side Panel */}
      {isListOpen && (
        <div className="absolute top-16 right-4 bottom-4 z-40 w-[92%] sm:w-[400px] max-h-[calc(100vh-5rem)] bg-[#111111]/95 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-modal-pop">
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#0A0A0A]/50">
            <h2 className="text-[#EDEDED] text-[13px] font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              Live Incidents ({incidents.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={fitToIncidents}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white cursor-pointer"
                title="Fit all incidents on map"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsListOpen(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-[#A1A1A1] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {incidents.length === 0 ? (
              <div className="text-center text-[#A1A1A1] mt-10 text-[13px]">
                No active incidents right now.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-[#1A1A1A] border border-white/[0.08] rounded-2xl p-3 flex flex-col gap-2.5 transition-all hover:border-white/[0.15]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/10">
                      Confirmed
                    </span>
                    <span className="text-[11px] text-[#A1A1A1] font-mono">
                      {new Date(inc.occurred_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-[#EDEDED] leading-snug">
                    {inc.address || "Coordinates recorded (Address unavailable)"}
                  </div>
                  <div className="text-[11px] text-[#A1A1A1] flex justify-between pt-1 border-t border-white/[0.04]">
                    <span>
                      {inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}
                    </span>
                    <span>👤 {inc.victim_name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => {
                        mapRef.current?.flyTo({ center: [inc.lng, inc.lat], zoom: 16 });
                        if (window.innerWidth < 640) setIsListOpen(false);
                      }}
                      className="flex-1 text-[11px] py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[#EDEDED] transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Locate
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteIncident(inc.id)}
                        className="flex-1 text-[11px] py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin Manual Simulation Form (when idle) */}
      {isAdmin && !pendingTag && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col sm:flex-row items-center gap-3 px-4 py-3 rounded-2xl bg-[#111111]/90 backdrop-blur-md border border-white/[0.08] text-[13px] text-[#A1A1A1] shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Lat:</span>
            <input
              type="text"
              placeholder="e.g. 37.7749"
              value={simulateLat}
              onChange={(e) => setSimulateLat(e.target.value)}
              className="bg-transparent border border-white/[0.1] rounded px-2 py-1 outline-none text-white w-[100px] focus:border-[#3291FF] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">Lng:</span>
            <input
              type="text"
              placeholder="e.g. -122.4194"
              value={simulateLng}
              onChange={(e) => setSimulateLng(e.target.value)}
              className="bg-transparent border border-white/[0.1] rounded px-2 py-1 outline-none text-white w-[100px] focus:border-[#3291FF] transition-colors"
            />
          </div>
          <button
            onClick={handleManualSimulate}
            className="flex items-center gap-1.5 bg-[#F1616B] hover:bg-[#d95560] text-white px-3 py-1.5 rounded transition-colors font-medium shadow-sm"
          >
            <AlertCircle className="w-4 h-4" />
            Accident
          </button>
        </div>
      )}

      {/* Floating 10-Second Countdown & Quick Actions Card */}
      {pendingTag && !isModalOpen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[440px] animate-modal-pop">
          <div
            className="rounded-3xl bg-[#111111]/95 backdrop-blur-xl p-5 shadow-2xl border border-white/[0.08] text-[#EDEDED] flex flex-col gap-3.5"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 20px 48px -12px rgba(0,0,0,0.85)",
            }}
          >
            {/* Top Indicator Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="text-[11px] font-mono font-medium text-[#EDEDED] uppercase tracking-wider">
                  Accident Tagged
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#A1A1A1]">
                {pendingTag.lat.toFixed(4)}, {pendingTag.lng.toFixed(4)}
              </span>
            </div>

            {/* Countdown Title & Time */}
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-medium text-[#EDEDED] flex items-center gap-2">
                <span>
                  Emergency Dispatch Console in{" "}
                  <span className="font-mono font-semibold text-white">
                    {countdown.toFixed(1)}s
                  </span>
                </span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className="h-full bg-white transition-[width] duration-100 ease-linear rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, (countdown / 10) * 100)
                  )}%`,
                }}
              />
            </div>

            {/* Actions: False Alarm (Cancel) & Open Dispatch Modal */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={handleFalseAlarm}
                className="flex-1 h-10 rounded-2xl bg-[#1A1A1A] hover:bg-[#222222] text-[#A1A1A1] hover:text-[#EDEDED] text-[13px] font-medium transition-all border border-white/[0.08] focus-ring active:scale-[0.98] cursor-pointer"
                title="Cancel simulation immediately (no alert sent, no DB row)"
              >
                False Alarm (Cancel)
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-10 px-4 rounded-2xl bg-[#EDEDED] hover:bg-white text-[#0A0A0A] text-[13px] font-semibold transition-all shadow-md focus-ring active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                title="Open Emergency Dispatch Console to choose alert options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Configure &amp; Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Single-Channel Dispatch Modal */}
      {pendingTag && (
        <EmergencyDispatchModal
          isOpen={isModalOpen}
          lat={pendingTag.lat}
          lng={pendingTag.lng}
          initialName={pendingTag.name || ""}
          onClose={handleFalseAlarm}
          onDispatch={handleDispatchFromModal}
          isDispatching={isDispatching}
        />
      )}

      {/* Confirmation & Delivery Notification Toast */}
      {toast && (
        <div className="absolute top-16 right-4 z-30 w-[92%] max-w-[380px] animate-modal-pop">
          <div
            className="rounded-3xl bg-[#111111]/95 backdrop-blur-xl p-4 shadow-2xl border border-white/[0.1] text-[#EDEDED] flex flex-col gap-2.5"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 16px 36px -8px rgba(0,0,0,0.8)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {toast.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                )}
                <span className="text-[13px] font-semibold text-[#EDEDED]">
                  {toast.title}
                </span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-[#6E6E6E] hover:text-[#EDEDED] transition-colors p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {toast.details && (
              <div className="text-[12px] text-[#EDEDED] bg-[#1A1A1A] p-2.5 rounded-2xl border border-white/[0.08] leading-relaxed font-mono">
                {toast.details}
              </div>
            )}

            {toast.address && (
              <div className="text-[12px] text-[#A1A1A1] leading-relaxed">
                📍 {toast.address}
              </div>
            )}

            {/* Delivery Channel Receipts */}
            {(toast.telegram || toast.email || toast.sms) && (
              <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-1.5 text-[11px] font-mono">
                {toast.telegram && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#EDEDED] shrink-0" />
                    <span className="text-[#EDEDED]">
                      Telegram: {toast.telegram.sent ? `Sent to ${toast.telegram.recipient}` : toast.telegram.message}
                    </span>
                  </div>
                )}

                {toast.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#EDEDED] shrink-0" />
                    <span className="text-[#EDEDED]">
                      Email: {toast.email.sent ? `Sent to ${toast.email.recipient}` : toast.email.message}
                    </span>
                  </div>
                )}

                {toast.sms && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#EDEDED] shrink-0" />
                    <span className="text-[#EDEDED]">
                      SMS: {toast.sms.sent ? `Sent to ${toast.sms.recipient}` : toast.sms.message}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
