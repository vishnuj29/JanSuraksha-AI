import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/voice_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class VoiceSettingsScreen extends StatefulWidget {
  const VoiceSettingsScreen({super.key});

  @override
  State<VoiceSettingsScreen> createState() => _VoiceSettingsScreenState();
}

class _VoiceSettingsScreenState extends State<VoiceSettingsScreen> {
  final _keywordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final voice = Provider.of<VoiceProvider>(context, listen: false);
    _keywordController.text = voice.customKeyword;
  }

  @override
  void dispose() {
    _keywordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final voice = Provider.of<VoiceProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hands-Free Trigger Setup'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
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
                          voice.isVoiceEnabled ? 'Hands-Free Radar: ACTIVE' : 'Voice Trigger: OFF',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: voice.isVoiceEnabled ? AppTheme.safeEmerald : Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Constantly listens for secret keyword even when phone is locked.',
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

            Text(
              'SECRET SAFE WORD',
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
                              content: Text('Keyword updated to "${_keywordController.text.trim()}"'),
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
                  const SizedBox(height: 12),
                  Text(
                    'Pre-configured Emergency Trigger Phrases:',
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: voice.voiceService.triggerWords.map((word) {
                      return Chip(
                        label: Text(word, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                        backgroundColor: AppTheme.surfaceLight,
                        avatar: const Icon(Icons.volume_up_rounded, size: 14, color: AppTheme.neonCyan),
                      );
                    }).toList(),
                  ),
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

            OutlinedButton.icon(
              onPressed: () {
                voice.voiceService.simulateVoiceTrigger('JanSuraksha');
              },
              icon: const Icon(Icons.play_circle_outline_rounded, color: AppTheme.neonCyan),
              label: const Text('Test Voice Recognition Event', style: TextStyle(color: AppTheme.neonCyan, fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.neonCyan),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
