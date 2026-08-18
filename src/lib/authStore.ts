import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: 'user' | 'admin' | 'responder';
  plan?: 'Free' | 'Premium';
  safetyScore?: number;
  avatar?: string;
  location?: string;
  joinedDate?: string;
  emergencyContactsCount?: number;
  voiceTriggerWord?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingEmailForOtp: string | null;

  // Actions
  setAuth: (user: UserProfile, token: string) => void;
  setPendingEmail: (email: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const TOKEN_KEY = 'jansuraksha_auth_token';
const USER_KEY = 'jansuraksha_user_profile';

const loadStoredAuth = (): { user: UserProfile | null; token: string | null } => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return { user, token };
    }
  } catch {
    // Clear corrupted storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { user: null, token: null };
};

const initialAuth = loadStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: !!initialAuth.token,
  isLoading: false,
  error: null,
  pendingEmailForOtp: null,

  setAuth: (user: UserProfile, token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Storage error:', err);
    }
    set({
      user,
      token,
      isAuthenticated: true,
      pendingEmailForOtp: null,
      error: null,
      isLoading: false,
    });
  },

  setPendingEmail: (email: string | null) => set({ pendingEmailForOtp: email }),

  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      pendingEmailForOtp: null,
      error: null,
    });
  },

  updateUser: (updates: Partial<UserProfile>) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...updates };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update stored profile:', err);
      }
      return { user: updated };
    });
  },

  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
};

export const getCurrentUser = (): UserProfile | null => {
  return useAuthStore.getState().user;
};
