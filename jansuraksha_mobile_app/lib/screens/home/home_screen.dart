import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:jansuraksha_mobile_app/providers/auth_provider.dart';
import 'package:jansuraksha_mobile_app/providers/sos_provider.dart';
import 'package:jansuraksha_mobile_app/providers/contacts_provider.dart';
import 'package:jansuraksha_mobile_app/providers/voice_provider.dart';
import 'package:jansuraksha_mobile_app/theme/app_theme.dart';
import 'package:jansuraksha_mobile_app/widgets/pulsing_sos_button.dart';
import 'package:jansuraksha_mobile_app/widgets/safety_radar_widget.dart';
import 'package:jansuraksha_mobile_app/widgets/quick_tool_card.dart';
import 'package:jansuraksha_mobile_app/screens/map/live_safety_map_screen.dart';
import 'package:jansuraksha_mobile_app/screens/contacts/guardian_contacts_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/fake_call_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/siren_strobe_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/voice_settings_screen.dart';
import 'package:jansuraksha_mobile_app/screens/vault/evidence_vault_screen.dart';
import 'package:jansuraksha_mobile_app/services/offline_sms_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final voice = Provider.of<VoiceProvider>(context, listen: false);
      final sos = Provider.of<SosProvider>(context, listen: false);

      voice.initializeTriggers(
        onTrigger: (keyword) {
          if (!sos.isSosActive && !sos.isCountingDown) {
            sos.initiateSos(
              triggerType: 'Hands-Free Voice Detection',
              triggerWord: keyword,
            );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.mic, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Text('Emergency voice trigger detected: "$keyword"!'),
                  ],
                ),
                backgroundColor: AppTheme.primaryRed,
                duration: const Duration(seconds: 4),
              ),
            );
          }
        },
      );
    });
  }

  void _showActiveSosSheet(BuildContext context, SosProvider sos, ContactsProvider contacts) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppTheme.primaryRed, width: 2),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryRed.withValues(alpha: 0.5),
                blurRadius: 36,
                spreadRadius: 8,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.primaryRed,
                    ),
                    child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'EMERGENCY SOS ACTIVE',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primaryRed,
                            letterSpacing: 1.2,
                          ),
                        ),
                        Text(
                          'Broadcast sent via Cloud + Offline SMS',
                          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.people_alt_rounded, color: AppTheme.safeEmerald, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Responders Notified',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ],
                    ),
                    Text(
                      '${sos.activeResponders} Guardians Active',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.safeEmerald),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => OfflineSmsService.makeEmergencyCall(number: '112'),
                      icon: const Icon(Icons.phone_in_talk_rounded, color: Colors.white),
                      label: const Text('Call 112 Police', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryRed,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        sos.resolveSos();
                        Navigator.of(ctx).pop();
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('I Am Safe Now', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final sos = Provider.of<SosProvider>(context);
    final contacts = Provider.of<ContactsProvider>(context);
    final voice = Provider.of<VoiceProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppTheme.primaryRed.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.shield_rounded, color: AppTheme.primaryRed, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'JanSuraksha AI',
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.safeEmerald),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'AI Threat Shield Active',
                      style: GoogleFonts.inter(fontSize: 10, color: AppTheme.safeEmerald, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.security_update_good_rounded, color: AppTheme.safeEmerald),
            onPressed: () {
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
            },
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.primaryRed.withValues(alpha: 0.2),
                        child: Text(
                          auth.user?.avatar ?? 'PS',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hello, ${auth.user?.name.split(' ')[0] ?? 'Priya'}',
                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                          Text(
                            '${contacts.contacts.length} Guardians Connected',
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.battery_charging_full_rounded, color: AppTheme.safeEmerald, size: 14),
                        const SizedBox(width: 4),
                        Text('88% GPS', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              PulsingSosButton(
                isCountingDown: sos.isCountingDown,
                countdownSeconds: sos.countdownSeconds,
                onCancelCountdown: sos.cancelCountdown,
                onTap: () {
                  sos.initiateSos(triggerType: 'One-Tap Manual SOS');
                  Future.delayed(const Duration(milliseconds: 5200), () {
                    if (!context.mounted) return;
                    if (sos.isSosActive) {
                      _showActiveSosSheet(context, sos, contacts);
                    }
                  });
                },
              ),

              const SizedBox(height: 24),

              SafetyRadarWidget(
                safetyScore: sos.locationService.safetyScore,
                location: sos.locationService.currentAddress,
                onOpenMap: () {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LiveSafetyMapScreen()));
                },
              ),

              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.mic_rounded,
                      title: 'Voice Trigger',
                      subtitle: voice.isVoiceEnabled ? '"${voice.customKeyword}"' : 'Turned Off',
                      accentColor: AppTheme.neonCyan,
                      isToggle: true,
                      isToggled: voice.isVoiceEnabled,
                      onToggleChanged: voice.toggleVoice,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
                      },
                    ),
                  ),
                  const SizedBox(width: 12),

                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.vibration_rounded,
                      title: 'Shake SOS',
                      subtitle: voice.isShakeEnabled ? '${voice.sensitivity} Sensitivity' : 'Turned Off',
                      accentColor: AppTheme.neonPurple,
                      isToggle: true,
                      isToggled: voice.isShakeEnabled,
                      onToggleChanged: voice.toggleShake,
                      onTap: () {
                        voice.shakeService.simulateShake();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Shake detection test simulated!'), backgroundColor: AppTheme.neonPurple),
                        );
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.phone_in_talk_rounded,
                      title: 'Fake Call',
                      subtitle: 'Simulate Call in 3s',
                      accentColor: AppTheme.warningAmber,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FakeCallScreen()));
                      },
                    ),
                  ),
                  const SizedBox(width: 12),

                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.notifications_active_rounded,
                      title: 'Siren & Strobe',
                      subtitle: 'Loud Police Alarm',
                      accentColor: AppTheme.primaryRed,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SirenStrobeScreen()));
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.group_add_rounded,
                      title: 'Guardians',
                      subtitle: '${contacts.contacts.length} Active Contacts',
                      accentColor: AppTheme.safeEmerald,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GuardianContactsScreen()));
                      },
                    ),
                  ),
                  const SizedBox(width: 12),

                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.lock_clock_rounded,
                      title: 'Evidence Vault',
                      subtitle: 'Encrypted Records',
                      accentColor: Colors.blueAccent,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EvidenceVaultScreen()));
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTab,
        onTap: (idx) {
          setState(() => _currentTab = idx);
          if (idx == 1) {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LiveSafetyMapScreen()));
          } else if (idx == 2) {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GuardianContactsScreen()));
          } else if (idx == 3) {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shield_rounded), label: 'Protection'),
          BottomNavigationBarItem(icon: Icon(Icons.map_rounded), label: 'Live Radar'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Guardians'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_voice_rounded), label: 'Voice Trigger'),
        ],
      ),
    );
  }
}
