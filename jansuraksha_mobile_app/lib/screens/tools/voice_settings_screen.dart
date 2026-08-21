import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/voice_provider.dart';
import '../../providers/contacts_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/sos_provider.dart';
import '../../providers/evidence_vault_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';


class VoiceSettingsScreen extends StatefulWidget {
  const VoiceSettingsScreen({super.key});

  @override
  State<VoiceSettingsScreen> createState() => _VoiceSettingsScreenState();
}

class _VoiceSettingsScreenState extends State<VoiceSettingsScreen> with SingleTickerProviderStateMixin {
  final _keywordController = TextEditingController();
  late AnimationController _waveAnimCtrl;

  @override
  void initState() {
    super.initState();
    final voice = Provider.of<VoiceProvider>(context, listen: false);
    _keywordController.text = voice.customKeyword;
    _waveAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _keywordController.dispose();
    _waveAnimCtrl.dispose();
    super.dispose();
  }

  void _triggerEmergencySimulation(BuildContext context, String word) {
    final sos = Provider.of<SosProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final contacts = Provider.of<ContactsProvider>(context, listen: false);
    final evidenceVault = Provider.of<EvidenceVaultProvider>(context, listen: false);
    final voice = Provider.of<VoiceProvider>(context, listen: false);

    voice.voiceService.simulateVoiceTrigger(word);
    sos.initiateSos(
      triggerType: 'Hands-Free Voice Detection ($word)',
      triggerWord: word,
      auth: auth,
      contacts: contacts,
      evidenceVault: evidenceVault,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🚨 Emergency Trigger "$word" active! Evidence captured & Admin (ec23019@glbitm.ac.in) + Guardians emailed.'),
        backgroundColor: AppTheme.primaryRed,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final voice = Provider.of<VoiceProvider>(context);
    final contacts = Provider.of<ContactsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Voice Sentinel & Trigger Setup'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Voice Sentinel Status Card
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: (voice.isVoiceEnabled ? AppTheme.safeEmerald : AppTheme.textMuted).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: (voice.isVoiceEnabled ? AppTheme.safeEmerald : AppTheme.textMuted).withValues(alpha: 0.4),
                      ),
                    ),
                    child: Icon(
                      voice.isVoiceEnabled ? Icons.mic_rounded : Icons.mic_off_rounded,
                      color: voice.isVoiceEnabled ? AppTheme.safeEmerald : AppTheme.textMuted,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          voice.isVoiceEnabled ? 'AI Voice Sentinel: ACTIVE' : 'Voice Sentinel: OFF',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: voice.isVoiceEnabled ? AppTheme.safeEmerald : Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Background audio engine continuously listens for emergency keywords.',
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Switch.adaptive(
                    value: voice.isVoiceEnabled,
                    activeTrackColor: AppTheme.safeEmerald,
                    onChanged: voice.toggleVoice,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Live Voice Visualizer & Test Lab
            Text(
              'LIVE VOICE DETECTION LAB',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 8),

            GlassCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Mic Audio Spectrum',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.neonCyan.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          voice.isVoiceEnabled ? 'LISTENING 24/7' : 'STANDBY',
                          style: const TextStyle(color: AppTheme.neonCyan, fontSize: 10, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Animated Wave Bars
                  AnimatedBuilder(
                    animation: _waveAnimCtrl,
                    builder: (ctx, child) {
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(14, (i) {
                          final multiplier = (i % 2 == 0 ? _waveAnimCtrl.value : (1.0 - _waveAnimCtrl.value));
                          final h = voice.isVoiceEnabled ? (12.0 + 28.0 * multiplier * ((i % 4 + 1) / 4)) : 6.0;
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: 5,
                            height: h,
                            decoration: BoxDecoration(
                              gradient: voice.isVoiceEnabled ? AppTheme.neonStoryGradient : null,
                              color: voice.isVoiceEnabled ? null : Colors.white24,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          );
                        }),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  if (voice.lastDetectedTrigger != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryRed.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.primaryRed),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.emergency_rounded, color: AppTheme.primaryRed, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Last Trigger: "${voice.lastDetectedTrigger}"',
                            style: const TextStyle(color: AppTheme.primaryRed, fontSize: 12, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _triggerEmergencySimulation(context, voice.customKeyword),
                          icon: const Icon(Icons.play_circle_outline_rounded, color: AppTheme.neonCyan, size: 18),
                          label: Text(
                            'Simulate "${voice.customKeyword}"',
                            style: const TextStyle(color: AppTheme.neonCyan, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.neonCyan),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'SECRET SAFE WORD & KEYWORDS',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 8),

            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _keywordController,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      labelText: 'Primary Emergency Trigger Word',
                      prefixIcon: const Icon(Icons.record_voice_over_rounded, color: AppTheme.neonCyan),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.check_circle_rounded, color: AppTheme.safeEmerald),
                        onPressed: () {
                          voice.updateKeyword(_keywordController.text.trim());
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Primary trigger updated to "${_keywordController.text.trim()}"'),
                              backgroundColor: AppTheme.safeEmerald,
                            ),
                          );
                        },
                      ),
                      filled: true,
                      fillColor: AppTheme.surface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Active Multi-Lingual Trigger Keywords:',
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: voice.voiceService.triggerWords.map((word) {
                      return ActionChip(
                        label: Text(word, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                        backgroundColor: AppTheme.surfaceLight,
                        avatar: const Icon(Icons.volume_up_rounded, size: 14, color: AppTheme.neonCyan),
                        onPressed: () => _triggerEmergencySimulation(context, word),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),


            const SizedBox(height: 24),

            // Guardian Broadcast Payload Preview
            Text(
              'AUTOMATED GUARDIAN DISPATCH',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 8),

            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.sms_rounded, color: AppTheme.safeEmerald, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        'Connected Guardians (${contacts.contacts.length})',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'When voice trigger is activated, an emergency SMS with your live GPS map link and audio record is immediately dispatched to:',
                    style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 10),
                  ...contacts.contacts.map((c) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_outline_rounded, color: AppTheme.safeEmerald, size: 14),
                            const SizedBox(width: 8),
                            Text(
                              '${c.name} (${c.phone})',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'HARDWARE SENSORS & GESTURES',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 8),

            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.vibration_rounded, color: AppTheme.neonPurple, size: 22),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Shake-to-Alert SOS',
                                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                              ),
                              Text(
                                'Shake phone rapidly 3 times to trigger',
                                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Switch.adaptive(
                        value: voice.isShakeEnabled,
                        activeTrackColor: AppTheme.neonPurple,
                        onChanged: voice.toggleShake,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Accelerometer Sensitivity',
                        style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                      ),
                      DropdownButton<String>(
                        value: voice.sensitivity,
                        dropdownColor: AppTheme.surfaceCard,
                        underline: const SizedBox(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        items: ['High', 'Medium', 'Low'].map((s) {
                          return DropdownMenuItem(value: s, child: Text(s));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) voice.setSensitivity(val);
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

