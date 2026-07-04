import { create } from 'zustand';
import type { Optimization } from './api';

export interface AppState {
  currentOptimization: Optimization | null;
  setCurrentOptimization: (result: Optimization | null) => void;

  optimizationStatus: 'idle' | 'running' | 'completed' | 'failed';
  setOptimizationStatus: (status: 'idle' | 'running' | 'completed' | 'failed') => void;

  optimizationError: string | null;
  setOptimizationError: (error: string | null) => void;

  historicalResults: Optimization[];
  setHistoricalResults: (results: Optimization[]) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentOptimization: null,
  setCurrentOptimization: (result) => set({ currentOptimization: result }),

  optimizationStatus: 'idle',
  setOptimizationStatus: (status) => set({ optimizationStatus: status }),

  optimizationError: null,
  setOptimizationError: (error) => set({ optimizationError: error }),

  historicalResults: [],
  setHistoricalResults: (results) => set({ historicalResults: results }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
