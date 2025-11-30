import { create } from 'zustand'

type ActiveTab = 'diagram' | 'drift'
type ToastType = 'error' | 'success' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface UiState {
  isLoading: boolean
  error: string | null
  activeTab: ActiveTab
  toasts: Toast[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
  clearError: () => void
  addToast: (message: string, type: ToastType) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isLoading: false,
  error: null,
  activeTab: 'diagram',
  toasts: [],

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearError: () => set({ error: null }),

  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
