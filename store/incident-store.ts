import { create } from "zustand";
import type { Incident } from "@/schemas/incident";

interface IncidentState {
  incidents: Incident[];
  isLoading: boolean;
  error: string | null;
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],
  isLoading: false,
  error: null,
  setIncidents: (incidents) => set({ incidents, error: null }),
  addIncident: (incident) =>
    set((state) => {
      // Deduplicate by ID
      const exists = state.incidents.some((item) => item.id === incident.id);
      if (exists) {
        return state;
      }
      return {
        incidents: [incident, ...state.incidents],
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
