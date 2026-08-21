import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:jansuraksha_mobile_app/providers/auth_provider.dart';
import 'package:jansuraksha_mobile_app/providers/sos_provider.dart';
import 'package:jansuraksha_mobile_app/providers/contacts_provider.dart';
import 'package:jansuraksha_mobile_app/providers/voice_provider.dart';
import 'package:jansuraksha_mobile_app/providers/theme_provider.dart';
import 'package:jansuraksha_mobile_app/providers/evidence_vault_provider.dart';
import 'package:jansuraksha_mobile_app/theme/app_theme.dart';
import 'package:jansuraksha_mobile_app/widgets/glass_card.dart';
import 'package:jansuraksha_mobile_app/widgets/pulsing_sos_button.dart';
import 'package:jansuraksha_mobile_app/widgets/safety_radar_widget.dart';
import 'package:jansuraksha_mobile_app/widgets/quick_tool_card.dart';
import 'package:jansuraksha_mobile_app/screens/map/live_safety_map_screen.dart';
import 'package:jansuraksha_mobile_app/screens/contacts/guardian_contacts_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/fake_call_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/siren_strobe_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/voice_settings_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/walk_with_me_screen.dart';
import 'package:jansuraksha_mobile_app/screens/places/nearby_safe_havens_screen.dart';
import 'package:jansuraksha_mobile_app/screens/membership/premium_membership_screen.dart';
import 'package:jansuraksha_mobile_app/screens/tools/database_settings_screen.dart';
import 'package:jansuraksha_mobile_app/screens/vault/evidence_vault_screen.dart';
import 'package:jansuraksha_mobile_app/screens/auth/login_screen.dart';
import 'package:jansuraksha_mobile_app/services/offline_sms_service.dart';



class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTab = 0;
  int _heroBannerIndex = 0;
  late Timer _bannerTimer;

  final List<Map<String, dynamic>> _heroBanners = [
    {
      'title': 'AI Threat Shield Active',
      'subtitle': 'Live GPS radar scanning 2.5km safety zone • 4 Police Patrols nearby',
      'tag': '98/100 SAFE ZONE',
      'tagColor': AppTheme.safeEmerald,
      'gradient': AppTheme.cardGradient,
      'icon': Icons.shield_rounded,
    },
    {
      'title': 'JanSuraksha Gold VIP',
      'subtitle': '₹5,00,000 Safety Cover & Priority 112 Police Dispatch active',
      'tag': 'VIP SUITE',
      'tagColor': AppTheme.goldPrimary,
      'gradient': AppTheme.goldCardGradient,
      'icon': Icons.workspace_premium_rounded,
    },
    {
      'title': 'Hands-Free Voice Sentinel',
      'subtitle': 'Say "Help", "Bachao", "Madad", or "Suraksha" for instant GPS alert',
      'tag': 'LISTENING 24/7',
      'tagColor': AppTheme.neonCyan,
      'gradient': AppTheme.cardGradient,
      'icon': Icons.mic_external_on_rounded,
    },
  ];

  @override
  void initState() {
    super.initState();
    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (mounted) {
        setState(() {
          _heroBannerIndex = (_heroBannerIndex + 1) % _heroBanners.length;
        });
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final voice = Provider.of<VoiceProvider>(context, listen: false);
      final sos = Provider.of<SosProvider>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final contacts = Provider.of<ContactsProvider>(context, listen: false);
      final evidenceVault = Provider.of<EvidenceVaultProvider>(context, listen: false);

      // Actively fetch live GPS location and update user profile
      try {
        final pos = await sos.locationService.getCurrentLocation();
        if (pos != null && sos.locationService.currentAddress.isNotEmpty) {
          auth.updateUserLocation(sos.locationService.currentAddress);
        }
      } catch (_) {}

      voice.initializeTriggers(
        onTrigger: (keyword) {
          if (!sos.isSosActive && !sos.isCountingDown) {
            sos.initiateSos(
              triggerType: 'Hands-Free Voice Detection ($keyword)',
              triggerWord: keyword,
              auth: auth,
              contacts: contacts,
              evidenceVault: evidenceVault,
            );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.mic_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text('🚨 Emergency Voice Trigger "$keyword" detected! Live GPS & Evidence dispatched to Admin & Family.'),
                    ),
                  ],
                ),
                backgroundColor: AppTheme.primaryRed,
                duration: const Duration(seconds: 5),
              ),
            );

            Future.delayed(const Duration(milliseconds: 4300), () {
              if (!mounted) return;
              if (sos.isSosActive) {
                _showActiveSosSheet(context, sos, contacts);
              }
            });

          }
        },
      );
    });


  }

  @override
  void dispose() {
    _bannerTimer.cancel();
    super.dispose();
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
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
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
                          'Live GPS Coordinates sent via Email & SMS to family & police',
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
                          'Guardians & Police Notified',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ],
                    ),
                    Text(
                      '${contacts.contacts.length} Responders',
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

  Widget _buildLeftSlideDrawer(BuildContext context, AuthProvider auth, ThemeProvider themeProvider) {
    final user = auth.user;
    final isAdmin = user?.isAdmin ?? false;
    final isGold = user?.isGold ?? false;

    return Drawer(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Account Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isGold ? const Color(0xFF1C170E) : Theme.of(context).cardColor,
                border: Border(
                  bottom: BorderSide(
                    color: isGold ? AppTheme.goldPrimary.withValues(alpha: 0.3) : Colors.white10,
                  ),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: isAdmin
                            ? AppTheme.safeEmerald.withValues(alpha: 0.2)
                            : (isGold ? AppTheme.goldPrimary.withValues(alpha: 0.2) : AppTheme.primaryRed.withValues(alpha: 0.2)),
                        child: Text(
                          isAdmin ? 'VJ' : (user?.avatar ?? 'PS'),
                          style: TextStyle(
                            color: isAdmin ? AppTheme.safeEmerald : (isGold ? AppTheme.goldPrimary : Colors.white),
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    isAdmin ? 'Vishnu Jaiswal (Admin)' : (user?.name ?? 'Priya Sharma'),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Icon(
                                  isAdmin ? Icons.admin_panel_settings_rounded : (isGold ? Icons.workspace_premium_rounded : null),
                                  color: isAdmin ? AppTheme.safeEmerald : AppTheme.goldPrimary,
                                  size: 16,
                                ),
                              ],
                            ),
                            Text(
                              user?.email ?? 'priya.sharma@example.com',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Membership Upgrade / Status Pill inside Drawer
                  InkWell(
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PremiumMembershipScreen()));
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: isGold ? AppTheme.goldGradient : null,
                        color: isGold ? null : AppTheme.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isAdmin ? AppTheme.safeEmerald : AppTheme.goldPrimary, width: 1),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isAdmin ? Icons.shield_rounded : Icons.workspace_premium_rounded,
                                color: isGold ? Colors.black : (isAdmin ? AppTheme.safeEmerald : AppTheme.goldPrimary),
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                isAdmin ? 'SUPER ADMIN • FULL ACCESS' : (isGold ? 'GOLD VIP MEMBER' : 'UPGRADE TO GOLD VIP'),
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: isGold ? Colors.black : (isAdmin ? AppTheme.safeEmerald : AppTheme.goldPrimary),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          Icon(
                            Icons.arrow_forward_ios_rounded,
                            size: 12,
                            color: isGold ? Colors.black : AppTheme.goldPrimary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 10),
                children: [
                  _buildDrawerSectionTitle('PROTECTION & DEFENSE'),
                  _buildDrawerItem(
                    icon: Icons.workspace_premium_rounded,
                    color: AppTheme.goldPrimary,
                    title: 'JanSuraksha Gold VIP',
                    subtitle: isGold ? 'Active VIP Plan' : '50% Off Special',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PremiumMembershipScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.mic_rounded,
                    color: AppTheme.neonCyan,
                    title: 'Voice Sentinel & Triggers',
                    subtitle: 'Hands-free distress detection',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.directions_walk_rounded,
                    color: AppTheme.safeEmerald,
                    title: 'Walk With Me',
                    subtitle: 'Live Escort Companion',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WalkWithMeScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.local_police_rounded,
                    color: AppTheme.primaryRed,
                    title: 'Nearby Safe Havens',
                    subtitle: 'Police, 24/7 Hospitals, Booths',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NearbySafeHavensScreen()));
                    },
                  ),

                  const Divider(color: Colors.white10, height: 24),
                  _buildDrawerSectionTitle('INCIDENT TOOLS & LOGS'),

                  _buildDrawerItem(
                    icon: Icons.lock_clock_rounded,
                    color: Colors.blueAccent,
                    title: 'Encrypted Evidence Vault',
                    subtitle: 'Photos, Audios & Blackbox',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EvidenceVaultScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.radar_rounded,
                    color: AppTheme.safeEmerald,
                    title: 'Live Threat Radar Map',
                    subtitle: 'Nearby police & danger zones',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LiveSafetyMapScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.phone_in_talk_rounded,
                    color: AppTheme.warningAmber,
                    title: 'AI Fake Caller Pro',
                    subtitle: 'Instant escape phone call',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FakeCallScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.notifications_active_rounded,
                    color: AppTheme.neonPink,
                    title: '110dB Siren & Strobe',
                    subtitle: 'High decibel deterrence alarm',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SirenStrobeScreen()));
                    },
                  ),
                  _buildDrawerItem(
                    icon: Icons.people_alt_rounded,
                    color: AppTheme.safeEmerald,
                    title: 'Guardian Contacts Circle',
                    subtitle: 'Manage alert recipients',
                    onTap: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GuardianContactsScreen()));
                    },
                  ),

                  const Divider(color: Colors.white10, height: 24),
                  _buildDrawerSectionTitle('PREFERENCES & SYSTEM'),

                  if (isAdmin) ...[
                    _buildDrawerItem(
                      icon: Icons.admin_panel_settings_rounded,
                      color: AppTheme.safeEmerald,
                      title: 'MySQL Database & Server',
                      subtitle: 'Super Admin • jansuraksha_db',
                      onTap: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DatabaseSettingsScreen()));
                      },
                    ),
                  ],

                  // Theme Switch Item
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              themeProvider.isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                              color: AppTheme.neonCyan,
                              size: 22,
                            ),
                            const SizedBox(width: 14),
                            Text(
                              themeProvider.isDarkMode ? 'Dark Theme' : 'Light Theme',
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        Switch.adaptive(
                          value: themeProvider.isDarkMode,
                          activeTrackColor: AppTheme.neonCyan,
                          onChanged: (val) => themeProvider.toggleTheme(val),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Logout Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 46,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    Navigator.of(context).pop();
                    await auth.logout();
                    if (!context.mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                      (route) => false,
                    );
                  },
                  icon: const Icon(Icons.logout_rounded, color: AppTheme.primaryRed, size: 18),
                  label: const Text(
                    'Log Out',
                    style: TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.primaryRed),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 6),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w900,
          color: AppTheme.textMuted,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        title,
        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, size: 18, color: Colors.white38),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final sos = Provider.of<SosProvider>(context);
    final contacts = Provider.of<ContactsProvider>(context);
    final voice = Provider.of<VoiceProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final evidenceVault = Provider.of<EvidenceVaultProvider>(context);
    final user = auth.user;
    final isGold = user?.isGold ?? false;

    return Scaffold(
      drawer: _buildLeftSlideDrawer(context, auth, themeProvider),
      appBar: AppBar(
        titleSpacing: 0,
        leading: Builder(
          builder: (drawerContext) => IconButton(
            icon: const Icon(Icons.menu_rounded, size: 26),
            tooltip: 'Open Menu & Account',
            onPressed: () => Scaffold.of(drawerContext).openDrawer(),
          ),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                gradient: AppTheme.sosGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.shield_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: AppTheme.primaryRed, size: 14),
                      const SizedBox(width: 2),
                      Flexible(
                        child: Text(
                          sos.locationService.currentAddress.isNotEmpty
                              ? sos.locationService.currentAddress.split(',')[0]
                              : 'Connaught Place, New Delhi',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const Icon(Icons.arrow_drop_down_rounded, size: 18),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.safeEmerald),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'AI Threat Shield Active',
                        style: GoogleFonts.inter(fontSize: 10, color: AppTheme.safeEmerald, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // VIP Gold Header Pill
          InkWell(
            onTap: () {
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PremiumMembershipScreen()));
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: isGold ? AppTheme.goldGradient : null,
                color: isGold ? null : AppTheme.surfaceLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.goldPrimary, width: 1.2),
                boxShadow: isGold
                    ? [
                        BoxShadow(
                          color: AppTheme.goldPrimary.withValues(alpha: 0.4),
                          blurRadius: 10,
                          spreadRadius: 1,
                        ),
                      ]
                    : [],
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.workspace_premium_rounded,
                    color: isGold ? Colors.black : AppTheme.goldPrimary,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isGold ? 'GOLD VIP' : 'UPGRADE',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: isGold ? Colors.black : AppTheme.goldPrimary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),

          // Theme Toggle Icon
          IconButton(
            icon: Icon(
              themeProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              color: themeProvider.isDarkMode ? Colors.amber : Colors.indigo,
              size: 22,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () => themeProvider.toggleTheme(!themeProvider.isDarkMode),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Emergency Countdown Alert Banner (Visible during countdown)
              if (sos.isCountingDown) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2C0A0A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.primaryRed, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryRed.withValues(alpha: 0.5),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          color: AppTheme.primaryRed,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${sos.countdownSeconds}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 22),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🚨 DISTRESS DETECTED: ${sos.sosTriggerType.toUpperCase()}',
                              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Auto-dispatching Live GPS & Evidence to Admin & Family in ${sos.countdownSeconds}s...',
                              style: GoogleFonts.inter(fontSize: 11, color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: sos.cancelCountdown,
                        child: const Text('CANCEL', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ],

              // Hero Rotating VIP / Safety Shield Banner
              InkWell(

                onTap: () {
                  if (_heroBannerIndex == 1) {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PremiumMembershipScreen()));
                  } else if (_heroBannerIndex == 2) {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
                  } else {
                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LiveSafetyMapScreen()));
                  }
                },
                borderRadius: BorderRadius.circular(20),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: _heroBanners[_heroBannerIndex]['gradient'] as LinearGradient,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: (_heroBanners[_heroBannerIndex]['tagColor'] as Color).withValues(alpha: 0.5),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (_heroBanners[_heroBannerIndex]['tagColor'] as Color).withValues(alpha: 0.2),
                        blurRadius: 20,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (_heroBanners[_heroBannerIndex]['tagColor'] as Color).withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          _heroBanners[_heroBannerIndex]['icon'] as IconData,
                          color: _heroBanners[_heroBannerIndex]['tagColor'] as Color,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: (_heroBanners[_heroBannerIndex]['tagColor'] as Color).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: _heroBanners[_heroBannerIndex]['tagColor'] as Color),
                                  ),
                                  child: Text(
                                    _heroBanners[_heroBannerIndex]['tag'],
                                    style: GoogleFonts.inter(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      color: _heroBanners[_heroBannerIndex]['tagColor'] as Color,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _heroBanners[_heroBannerIndex]['title'],
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _heroBanners[_heroBannerIndex]['subtitle'],
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.white54),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Hero Pulsing SOS Emergency Ring
              PulsingSosButton(
                isCountingDown: sos.isCountingDown,
                countdownSeconds: sos.countdownSeconds,
                onCancelCountdown: sos.cancelCountdown,
                onTap: () {
                  sos.initiateSos(
                    triggerType: 'One-Tap Manual SOS',
                    auth: auth,
                    contacts: contacts,
                    evidenceVault: evidenceVault,
                  );
                  Future.delayed(const Duration(milliseconds: 5200), () {
                    if (!context.mounted) return;
                    if (sos.isSosActive) {
                      _showActiveSosSheet(context, sos, contacts);
                    }
                  });
                },
              ),

              const SizedBox(height: 24),

              // Safety Radar & Location Card
              SafetyRadarWidget(
                safetyScore: sos.locationService.safetyScore,
                location: sos.locationService.currentAddress,
                onOpenMap: () {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LiveSafetyMapScreen()));
                },
              ),

              const SizedBox(height: 24),

              // AI Defense Suite Grid (Clean 2x2 Bento Box)
              Text(
                'AI DEFENSE & ESSENTIAL TOOLS',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 10),

              Row(
                children: [
                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.mic_rounded,
                      title: 'Voice Sentinel',
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
                      icon: Icons.directions_walk_rounded,
                      title: 'Walk With Me',
                      subtitle: 'Live Escort Companion',
                      accentColor: AppTheme.safeEmerald,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const WalkWithMeScreen()));
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
                      icon: Icons.local_police_rounded,
                      title: 'Safe Havens',
                      subtitle: 'Police & 24/7 Hospitals',
                      accentColor: AppTheme.primaryRed,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NearbySafeHavensScreen()));
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: QuickToolCard(
                      icon: Icons.lock_clock_rounded,
                      title: 'Evidence Vault',
                      subtitle: '${evidenceVault.items.length} Encrypted Records',
                      accentColor: Colors.blueAccent,
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EvidenceVaultScreen()));
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Nearby Safe Havens Preview Carousel
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'NEARBY SAFE HAVENS',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                      letterSpacing: 1.2,
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NearbySafeHavensScreen()));
                    },
                    child: Text(
                      'View All (5) →',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.neonCyan,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              SizedBox(
                height: 135,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildSafeHavenMiniCard(
                      'Central Police Station',
                      '0.4 km • 3 min walk',
                      'POLICE HQ',
                      AppTheme.primaryRed,
                      Icons.local_police_rounded,
                      '011-23361100',
                    ),
                    const SizedBox(width: 12),
                    _buildSafeHavenMiniCard(
                      'Pink Women Help Booth',
                      '0.6 km • 5 min walk',
                      'WOMEN BOOTH',
                      AppTheme.neonPink,
                      Icons.security_rounded,
                      '1091',
                    ),
                    const SizedBox(width: 12),
                    _buildSafeHavenMiniCard(
                      'Dr. RML 24/7 Trauma',
                      '1.1 km • 8 min drive',
                      'HOSPITAL 24/7',
                      AppTheme.safeEmerald,
                      Icons.local_hospital_rounded,
                      '011-23365525',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Community Safety Live Feed
              Text(
                'COMMUNITY SAFETY LIVE FEED',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 10),

              GlassCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildFeedItem(
                      '🚨 Police PCR Van patrolling Barakhamba Road',
                      '2 mins ago • Verified by Delhi Police Network',
                      AppTheme.safeEmerald,
                    ),
                    const Divider(color: Colors.white10),
                    _buildFeedItem(
                      '💡 Street lights restored at Sector 4 Park Corner',
                      '15 mins ago • Community safety update',
                      AppTheme.neonCyan,
                    ),
                    const Divider(color: Colors.white10),
                    _buildFeedItem(
                      '🛡️ Safe Corridor active: Rajiv Chowk Gate 2 to 4',
                      '1 hour ago • Pink Sentinel on duty',
                      AppTheme.neonPink,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
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
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PremiumMembershipScreen()));
          } else if (idx == 3) {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const GuardianContactsScreen()));
          } else if (idx == 4) {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const VoiceSettingsScreen()));
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shield_rounded), label: 'Protection'),
          BottomNavigationBarItem(icon: Icon(Icons.map_rounded), label: 'Live Radar'),
          BottomNavigationBarItem(icon: Icon(Icons.workspace_premium_rounded), label: 'VIP Gold'),
          BottomNavigationBarItem(icon: Icon(Icons.people_alt_rounded), label: 'Guardians'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_voice_rounded), label: 'Voice Trigger'),
        ],
      ),
    );
  }

  Widget _buildSafeHavenMiniCard(
    String name,
    String dist,
    String badge,
    Color color,
    IconData icon,
    String phone,
  ) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color),
                ),
                child: Text(
                  badge,
                  style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: color),
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
              ),
              const SizedBox(height: 2),
              Text(dist, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.safeEmerald, fontWeight: FontWeight.w600)),
            ],
          ),
          InkWell(
            onTap: () => OfflineSmsService.makeEmergencyCall(number: phone),
            child: Row(
              children: [
                Icon(Icons.call_rounded, color: color, size: 14),
                const SizedBox(width: 4),
                Text('Call ($phone)', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedItem(String title, String subtitle, Color accent) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 4),
            width: 8,
            height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: accent),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 2),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
