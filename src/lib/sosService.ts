/**
 * Enterprise SOS Emergency Service
 * Geolocation resolution, contact notifications, and distress broadcasting
 */

import { locationService, LocationCoordinates } from './locationService';
import { api } from './api-client';
import { getCurrentUser } from './authStore';

export interface SOSPayload {
  phone?: string;
  user?: string;
  userId?: string;
  location?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
  timestamp?: string;
  triggerWord?: string;
}

export interface SOSResponse {
  success: boolean;
  message: string;
  alertId?: string;
  alert?: any;
  timestamp?: string;
}

/**
 * Trigger SOS alert via central API
 */
export const triggerSOSAlert = async (payload: SOSPayload): Promise<SOSResponse> => {
  try {
    const user = getCurrentUser();
    let storedGuardianEmails: string[] = [];
    try {
      const stored = localStorage.getItem('guardianEmails');
      if (stored) storedGuardianEmails = JSON.parse(stored);
    } catch {}

    const result = await api.sos.trigger({
      ...payload,
      user: payload.user || user?.name || 'JanSuraksha User',
      userId: payload.userId || user?.id,
      phone: payload.phone || user?.phone || '+919876543210',
      userEmail: user?.email || localStorage.getItem('userEmail') || undefined,
      guardianEmails: storedGuardianEmails,
      timestamp: payload.timestamp || new Date().toISOString(),
    });

    return result as SOSResponse;
  } catch (error) {
    console.error('[SOS Service] Trigger error:', error);
    throw error;
  }
};

/**
 * Full SOS workflow: Resolve live location -> reverse geocode -> dispatch alert
 */
export const sendSOSEmergency = async (
  phone?: string,
  triggerWord?: string,
  customMessage?: string
): Promise<SOSResponse> => {
  try {
    const user = getCurrentUser();
    const targetPhone = phone || user?.phone || '+919876543210';

    // 1. Get accurate location with fallback
    let coords: LocationCoordinates | undefined;
    let addressStr: string | undefined;
    let locationMapUrl: string | undefined;

    try {
      const locState = await locationService.getCurrentPosition();
      if (locState.coords) {
        coords = locState.coords;
        addressStr = locState.address.formattedAddress;
        locationMapUrl = locationService.formatMapUrl(locState.coords);
      }
    } catch (locErr) {
      console.warn('[SOS Service] Location resolution warning:', locErr);
    }

    if (!locationMapUrl && coords) {
      locationMapUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    }

    // 2. Dispatch SOS alert
    const result = await triggerSOSAlert({
      phone: targetPhone,
      user: user?.name,
      userId: user?.id,
      location: locationMapUrl,
      address: addressStr,
      coordinates: coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined,
      triggerWord: triggerWord || 'Manual SOS',
      message:
        customMessage ||
        `🚨 EMERGENCY ALERT from ${user?.name || 'JanSuraksha User'}!${
          addressStr ? ` Location: ${addressStr}` : ''
        }`,
    });

    return result;
  } catch (error) {
    console.error('[SOS Service] Emergency dispatch failed:', error);
    throw error;
  }
};

/**
 * Cancel or mark current emergency resolved
 */
export const resolveSOSEmergency = async (alertId?: string) => {
  return api.sos.resolve(alertId);
};
