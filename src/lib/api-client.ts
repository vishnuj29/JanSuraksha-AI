/**
 * Enterprise API Client for JanSuraksha AI
 * Centralized HTTP client connecting all frontend pages with backend endpoints
 */

import { getAuthToken } from './authStore';

const API_BASE = '/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth
  auth: {
    register: (data: { name: string; email: string; password: string; phone: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    registerInitiate: (data: { name: string; email: string; password: string; phone: string }) =>
      request('/auth/register-initiate', { method: 'POST', body: JSON.stringify(data) }),

    registerVerify: (data: { email: string; otp: string }) =>
      request('/auth/register-verify', { method: 'POST', body: JSON.stringify(data) }),

    registerResendOtp: (data: { email: string }) =>
      request('/auth/register-resend-otp', { method: 'POST', body: JSON.stringify(data) }),

    login: (data: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

    loginInitiate: (data: { email: string; password: string }) =>
      request('/auth/login-initiate', { method: 'POST', body: JSON.stringify(data) }),

    loginVerify: (data: { email: string; otp: string }) =>
      request('/auth/login-verify', { method: 'POST', body: JSON.stringify(data) }),

    resendOtp: (data: { email: string }) =>
      request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),

    getMe: () => request('/auth/me', { method: 'GET' }),
  },

  // SOS Emergency
  sos: {
    trigger: (data: {
      phone?: string;
      user?: string;
      userId?: string;
      location?: string;
      address?: string;
      coordinates?: { latitude: number; longitude: number };
      message?: string;
      triggerWord?: string;
      timestamp?: string;
    }) => request('/sos', { method: 'POST', body: JSON.stringify(data) }),

    resolve: (alertId?: string) =>
      request('/sos/resolve', { method: 'POST', body: JSON.stringify({ alertId }) }),

    getActive: () => request('/sos/active', { method: 'GET' }),

    getHistory: () => request('/sos/history', { method: 'GET' }),
  },

  // Emergency Contacts
  contacts: {
    getAll: () => request('/contacts', { method: 'GET' }),

    add: (contact: {
      name: string;
      phone: string;
      relation: string;
      isPrimary?: boolean;
      notifyLevel?: string;
      shareLocation?: boolean;
    }) => request('/contacts', { method: 'POST', body: JSON.stringify(contact) }),

    update: (contact: {
      id: string;
      name?: string;
      phone?: string;
      relation?: string;
      isPrimary?: boolean;
      notifyLevel?: string;
      shareLocation?: boolean;
    }) => request('/contacts', { method: 'PUT', body: JSON.stringify(contact) }),

    delete: (id: string) => request('/contacts', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },

  // Live Tracking
  tracking: {
    updateLocation: (data: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      accuracy?: number;
    }) => request('/tracking/update', { method: 'POST', body: JSON.stringify(data) }),

    getRiskZones: (lat: number, lng: number, city?: string) =>
      request(
        `/tracking/risk-zones?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}${
          city ? `&city=${encodeURIComponent(city)}` : ''
        }`,
        { method: 'GET' }
      ),
  },

  // Evidence Vault
  vault: {
    getAll: () => request('/vault', { method: 'GET' }),

    upload: (item: {
      type: 'photo' | 'video' | 'audio';
      title?: string;
      size?: string;
      duration?: string;
      emergency?: boolean;
      encrypted?: boolean;
      dataUrl?: string;
    }) => request('/vault', { method: 'POST', body: JSON.stringify(item) }),

    delete: (id: string) => request('/vault', { method: 'DELETE', body: JSON.stringify({ id }) }),
  },

  // Voice Trigger
  voice: {
    getConfig: () => request('/voice/config', { method: 'GET' }),

    updateConfig: (config: {
      triggerWord: string;
      sensitivity?: 'low' | 'medium' | 'high';
      autoSos?: boolean;
      continuousListening?: boolean;
    }) => request('/voice/config', { method: 'PUT', body: JSON.stringify(config) }),
  },

  // Community Rescue Network
  community: {
    getHelpers: (lat: number, lng: number) =>
      request(`/community/helpers?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
        method: 'GET',
      }),

    requestHelp: (data: { helperId?: string; coordinates?: { latitude: number; longitude: number }; address?: string }) =>
      request('/community/request-help', { method: 'POST', body: JSON.stringify(data) }),

    getIncidents: () => request('/community/incidents', { method: 'GET' }),

    reportIncident: (incident: {
      title: string;
      category: string;
      location: string;
      coordinates?: { latitude: number; longitude: number };
      severity: string;
      description?: string;
    }) => request('/community/incidents', { method: 'POST', body: JSON.stringify(incident) }),
  },

  // AI Safety Assistant
  assistant: {
    chat: (data: {
      message: string;
      location?: { city?: string; address?: string };
      coordinates?: { latitude: number; longitude: number };
    }) => request('/assistant/chat', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Admin Dashboard
  admin: {
    getStats: () => request('/admin/stats', { method: 'GET' }),
    getUsers: () => request('/admin/users', { method: 'GET' }),
    getAlerts: () => request('/admin/alerts', { method: 'GET' }),
    updateAlert: (id: string, status: string) =>
      request('/admin/alerts', { method: 'PUT', body: JSON.stringify({ id, status }) }),
  },
};

export default api;
