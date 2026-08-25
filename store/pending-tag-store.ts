import { create } from "zustand";

export interface PendingTag {
  lat: number;
  lng: number;
  taggedAt: number; // unix timestamp ms
  name?: string;
  contact?: string;
}

interface PendingTagState {
  pendingTag: PendingTag | null;
  setPendingTag: (tag: {
    lat: number;
    lng: number;
    name?: string;
    contact?: string;
  }) => boolean;
  updatePendingTag: (fields: Partial<Pick<PendingTag, "name" | "contact">>) => void;
  clearPendingTag: () => void;
}

export const usePendingTagStore = create<PendingTagState>((set, get) => ({
  pendingTag: null,
  setPendingTag: (tag) => {
    // Only one pending tag allowed at a time
    if (get().pendingTag !== null) {
      return false;
    }
    set({
      pendingTag: {
        lat: tag.lat,
        lng: tag.lng,
        taggedAt: Date.now(),
        name: tag.name ?? "",
        contact: tag.contact ?? "",
      },
    });
    return true;
  },
  updatePendingTag: (fields) =>
    set((state) => ({
      pendingTag: state.pendingTag
        ? { ...state.pendingTag, ...fields }
        : null,
    })),
  clearPendingTag: () => set({ pendingTag: null }),
}));
