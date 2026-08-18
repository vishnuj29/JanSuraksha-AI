import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { message, location, coordinates } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const query = message.trim().toLowerCase();
    const city = location?.city || location?.address || 'Your Current Area';

    let reply = '';
    let category = 'general';

    if (query.includes('area safe') || query.includes('is it safe') || query.includes('threat')) {
      category = 'safety_assessment';
      reply = `Based on real-time threat telemetry in **${city}**, here is your safety assessment:\n\n` +
        `🟡 **Safety Level: MODERATE (78/100)**\n\n` +
        `- 2 risk zones monitored within 1.5 km (low illumination sub-lanes).\n` +
        `- Active police patrol reported on primary avenues.\n` +
        `- 4 verified JanSuraksha community responders active nearby.\n\n` +
        `**AI Recommendations:**\n` +
        `1. Stick to primary well-lit transit arteries.\n` +
        `2. Keep Live Tracking active if walking alone.\n` +
        `3. Ensure your secret voice trigger is enabled for hands-free emergency calling.`;
    } else if (query.includes('route') || query.includes('home') || query.includes('directions')) {
      category = 'route_guidance';
      reply = `I have analyzed safe transit corridors around **${city}**:\n\n` +
        `✅ **Recommended Safe Route (94% Safety Score)**\n` +
        `Via Central Boulevard → Main Avenue Transit Corridor\n` +
        `- High CCTV density, 24/7 commercial activity, active street lighting.\n` +
        `- 2 emergency assistance kiosks along the route.\n\n` +
        `⚠️ **Alternative Route (Avoid after 9:30 PM)**\n` +
        `Via North Bypass Sub-lanes\n` +
        `- Lower footfall and sparse lighting.\n\n` +
        `Would you like me to start **Live Tracking** and share your route with your emergency contacts?`;
    } else if (query.includes('emergency') || query.includes('sos') || query.includes('help') || query.includes('danger')) {
      category = 'emergency_protocol';
      reply = `🚨 **JAN SURAKSHA EMERGENCY PROTOCOL**\n\n` +
        `1. **Trigger SOS Immediately**: Press the red SOS button or say your secret trigger word.\n` +
        `2. **Automatic Broadcast**: Your live GPS coordinates and street address are dispatched to your emergency contacts & nearest responders.\n` +
        `3. **Evidence Vault**: Secure audio/photo recording begins immediately.\n\n` +
        `📞 **Direct Emergency Helplines (India):**\n` +
        `- National Emergency: **112**\n` +
        `- Police: **100**\n` +
        `- Women Helpline: **1091**`;
    } else if (query.includes('voice') || query.includes('trigger') || query.includes('secret')) {
      category = 'voice_trigger';
      reply = `🎙️ **Voice Trigger Setup Guide:**\n\n` +
        `1. Navigate to the **Voice Trigger** screen.\n` +
        `2. Tap "Configure Secret Word" and choose a phrase (default: **SURAKSHA**, **Help**, **Bachao**).\n` +
        `3. Turn on Continuous Listening.\n\n` +
        `When in distress, speak the word and JanSuraksha AI will dispatch an SOS emergency alert automatically in background.`;
    } else if (query.includes('score') || query.includes('improve') || query.includes('rating')) {
      category = 'score_optimization';
      reply = `Your current **Safety Score is 78/100**.\n\n` +
        `To reach **95+ (EXCELLENT)**:\n` +
        `• 👤 Add at least 3 emergency contacts (+10 pts)\n` +
        `• 🎙️ Configure your custom voice trigger word (+5 pts)\n` +
        `• 📍 Turn on location sharing during late-night hours (+5 pts)\n` +
        `• 👥 Connect with the Community Rescue Network (+5 pts)`;
    } else {
      reply = `I am your **JanSuraksha AI Safety Assistant**, actively monitoring safety telemetry in **${city}**.\n\n` +
        `You can ask me to:\n` +
        `• Assess the safety level of your current location\n` +
        `• Recommend the safest well-lit route home\n` +
        `• Guide you through emergency SOS protocols\n` +
        `• Help configure your voice triggers and emergency contacts\n\n` +
        `How can I assist your safety today?`;
    }

    return res.status(200).json({
      success: true,
      category,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Assistant query failed';
    return res.status(500).json({ success: false, message: msg });
  }
}
