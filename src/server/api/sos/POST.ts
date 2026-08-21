import type { Request, Response } from 'express';
import Twilio from 'twilio';
import { dbStore } from '../../services/dbStore';
import { emailService } from '../../services/emailService';

interface SOSRequest {
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
  triggerWord?: string;
  timestamp?: string;
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const sendWhatsAppAlert = async (phone: string, message: string): Promise<string> => {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE = process.env.TWILIO_WHATSAPP_PHONE;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    console.log('[SOS TWILIO DEV] Twilio credentials not set. Logging alert:', { phone, message });
    return `MOCK_TWILIO_${Date.now()}`;
  }

  try {
    const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const payload = {
      from: TWILIO_PHONE.startsWith('whatsapp:') ? TWILIO_PHONE : `whatsapp:${TWILIO_PHONE}`,
      to: phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`,
      body: message,
    };

    const messageInstance = await client.messages.create(payload);
    return messageInstance.sid || `ALERT_${Date.now()}`;
  } catch (error) {
    console.error('[SOS Twilio Error]:', error);
    return `FALLBACK_${Date.now()}`;
  }
};

export default async function handler(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed. Use POST.' });
    }

    const {
      phone: rawPhone,
      user: rawUser,
      userId,
      userEmail,
      guardianEmails,
      location,
      address,
      coordinates,
      triggerWord,
      message: customMessage,
      timestamp,
    } = req.body as (SOSRequest & { userEmail?: string; guardianEmails?: string[] });

    const phone = rawPhone || '+919876543210';
    const userName = rawUser || 'JanSuraksha User';
    const timeStr = timestamp
      ? new Date(timestamp).toLocaleString('en-IN')
      : new Date().toLocaleString('en-IN');

    const locationDisplay =
      address || location || (coordinates ? `Lat: ${coordinates.latitude.toFixed(4)}, Lng: ${coordinates.longitude.toFixed(4)}` : 'Live Area');
    const locationMapUrl = coordinates
      ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
      : location && location.startsWith('http')
      ? location
      : undefined;

    // Record in DB Store
    const alertRecord = dbStore.createSosAlert({
      userId,
      user: userName,
      phone,
      type: triggerWord ? 'Voice Trigger' : 'Manual SOS',
      time: timeStr,
      location: locationDisplay,
      coordinates,
      status: 'Active',
      responders: 3,
      triggerWord,
      message: customMessage || '🚨 Emergency distress signal activated',
      timestamp: new Date().toISOString(),
    });

    // Format Emergency Message
    const fullMessage =
      `🚨 *JAN SURAKSHA EMERGENCY ALERT* 🚨\n\n` +
      `*Trigger:* ${triggerWord || 'Instant SOS'}\n` +
      `*User:* ${userName} (${phone})\n` +
      `*Time:* ${timeStr}\n` +
      (locationDisplay ? `*Location:* ${locationDisplay}\n` : '') +
      (locationMapUrl ? `*GPS Map:* ${locationMapUrl}\n\n` : '\n') +
      `Please check on this person immediately or dispatch responders!`;

    // 1. Dispatch Twilio WhatsApp/SMS
    const alertId = await sendWhatsAppAlert(phone, fullMessage);

    // 2. Dispatch SMTP Emergency Alert Email to all guardian emails, user email, and admin
    const emergencyRecipients: string[] = [];
    if (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) {
      emergencyRecipients.push(process.env.SMTP_USER);
    }
    if (process.env.EMERGENCY_ALERT_EMAIL && process.env.EMERGENCY_ALERT_EMAIL.includes('@')) {
      emergencyRecipients.push(process.env.EMERGENCY_ALERT_EMAIL);
    }

    if (userEmail && userEmail.includes('@') && !emergencyRecipients.includes(userEmail)) {
      emergencyRecipients.push(userEmail);
    }

    if (Array.isArray(guardianEmails)) {
      for (const gEmail of guardianEmails) {
        if (gEmail && typeof gEmail === 'string' && gEmail.includes('@') && !emergencyRecipients.includes(gEmail)) {
          emergencyRecipients.push(gEmail);
        }
      }
    }

    // Include registered user email if userId is available
    if (userId) {
      const userObj = dbStore.findUserById(userId);
      if (userObj?.email && !emergencyRecipients.includes(userObj.email)) {
        emergencyRecipients.push(userObj.email);
      }
      const contacts = dbStore.getContacts(userId);
      for (const c of contacts) {
        if (c.email && c.email.includes('@') && !emergencyRecipients.includes(c.email)) {
          emergencyRecipients.push(c.email);
        }
      }
    }

    if (emergencyRecipients.length > 0) {
      emailService
        .sendSOSEmergencyEmail(emergencyRecipients, {
          userName,
          phone,
          locationUrl: locationMapUrl,
          address: locationDisplay,
          triggerWord,
          timestamp: timeStr,
        })
        .then((res) => {
          console.log(`[SOS EMAIL DISPATCH] Sent to [${emergencyRecipients.join(', ')}]. Result:`, res);
        })
        .catch((err) => console.error('[SOS Email Dispatch Error]:', err));
    }

    const responseTime = Date.now() - startTime;
    console.log(`[SOS ALERT DISPATCHED] ID: ${alertRecord.id} in ${responseTime}ms for ${userName}`);

    return res.status(200).json({
      success: true,
      message: '🚨 Emergency alert triggered! Responders & contacts notified.',
      alertId: alertRecord.id,
      alert: alertRecord,
      timestamp: alertRecord.timestamp,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SOS ERROR]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert',
      error: errorMsg,
    });
  }
}
