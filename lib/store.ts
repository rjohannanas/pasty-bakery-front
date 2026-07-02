import { create } from 'zustand';
import type { OptimizationResult } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
}

export interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;

  currentOptimization: OptimizationResult | null;
  setCurrentOptimization: (result: OptimizationResult | null) => void;

  optimizationStatus: 'idle' | 'running' | 'completed' | 'failed';
  setOptimizationStatus: (status: 'idle' | 'running' | 'completed' | 'failed') => void;

  optimizationError: string | null;
  setOptimizationError: (error: string | null) => void;

  historicalResults: OptimizationResult[];
  setHistoricalResults: (results: OptimizationResult[]) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

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
