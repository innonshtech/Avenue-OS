import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      zoomLevel: 90, // Standard zoom level requested by user
      setZoomLevel: (level: number) => set({ zoomLevel: level }),
    }),
    {
      name: 'ui-settings',
    }
  )
);
