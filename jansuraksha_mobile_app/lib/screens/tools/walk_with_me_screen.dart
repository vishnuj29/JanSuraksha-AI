import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/contacts_provider.dart';
import '../../providers/sos_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../../services/offline_sms_service.dart';

class WalkWithMeScreen extends StatefulWidget {
  const WalkWithMeScreen({super.key});

  @override
  State<WalkWithMeScreen> createState() => _WalkWithMeScreenState();
}

class _WalkWithMeScreenState extends State<WalkWithMeScreen> {
  int _selectedMinutes = 15;
  bool _isJourneyActive = false;
  int _remainingSeconds = 0;
  Timer? _journeyTimer;
  final TextEditingController _destinationCtrl = TextEditingController(text: 'Home (Metro to Apartment)');

  final List<int> _presetMinutes = [5, 10, 15, 20, 30, 45];

  @override
  void dispose() {
    _journeyTimer?.cancel();
    _destinationCtrl.dispose();
    super.dispose();
  }

  void _startJourney() {
    setState(() {
      _isJourneyActive = true;
      _remainingSeconds = _selectedMinutes * 60;
    });

    final contacts = Provider.of<ContactsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final sos = Provider.of<SosProvider>(context, listen: false);

    final lat = sos.locationService.currentPosition?.latitude ?? 28.6139;
    final lng = sos.locationService.currentPosition?.longitude ?? 77.2090;
    final userName = auth.user?.name ?? 'Priya';
    final dest = _destinationCtrl.text.trim();

    // Broadcast live journey start via SMS to guardians
    if (contacts.primaryPhoneNumbers.isNotEmpty) {
      OfflineSmsService.sendEmergencySms(
        phoneNumbers: contacts.primaryPhoneNumbers,
        latitude: lat,
        longitude: lng,
        userName: userName,
        customMessage: '🚶 WALK WITH ME: $userName started a $_selectedMinutes min journey to "$dest". Live tracking: https://maps.google.com/?q=$lat,$lng. You will be alerted if not checked in.',
      );
    }

    _journeyTimer?.cancel();
    _journeyTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 1) {
        setState(() => _remainingSeconds--);
      } else {
        _journeyTimer?.cancel();
        setState(() => _remainingSeconds = 0);
        _onJourneyTimeout();
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.share_location_rounded, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(
              child: Text('Live companion tracking started. Guardians notified of your trip!'),
            ),
          ],
        ),
        backgroundColor: AppTheme.safeEmerald,
      ),
    );
  }

  void _onJourneyTimeout() {
    if (!_isJourneyActive) return;

    final sos = Provider.of<SosProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final contacts = Provider.of<ContactsProvider>(context, listen: false);

    sos.initiateSos(
      triggerType: 'Walk With Me Journey Expiry (Unanswered Check-in)',
      auth: auth,
      contacts: contacts,
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.primaryRed, width: 2),
        ),
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: AppTheme.primaryRed, size: 28),
            const SizedBox(width: 10),
            Text(
              'Trip Timeout Alert!',
              style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: AppTheme.primaryRed),
            ),
          ],
        ),
        content: Text(
          'Journey timer expired without confirmation. Emergency alerts dispatched to your guardian circle.',
          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              sos.resolveSos();
              setState(() => _isJourneyActive = false);
              Navigator.of(ctx).pop();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.safeEmerald),
            child: const Text('I Am Safe', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _finishJourneySafe() {
    _journeyTimer?.cancel();
    setState(() => _isJourneyActive = false);

    final contacts = Provider.of<ContactsProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final sos = Provider.of<SosProvider>(context, listen: false);

    final lat = sos.locationService.currentPosition?.latitude ?? 28.6139;
    final lng = sos.locationService.currentPosition?.longitude ?? 77.2090;
    final userName = auth.user?.name ?? 'Priya';

    if (contacts.primaryPhoneNumbers.isNotEmpty) {
      OfflineSmsService.sendEmergencySms(
        phoneNumbers: contacts.primaryPhoneNumbers,
        latitude: lat,
        longitude: lng,
        userName: userName,
        customMessage: '✅ SAFE ARRIVAL: $userName has safely reached their destination. Live companion session concluded.',
      );
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🎉 Wonderful! Safe arrival confirmation sent to guardians.'),
        backgroundColor: AppTheme.safeEmerald,
      ),
    );
  }

  String _formatDuration(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final contacts = Provider.of<ContactsProvider>(context);
    final sos = Provider.of<SosProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Walk With Me • Live Companion'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Status Hero Card
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (_isJourneyActive ? AppTheme.safeEmerald : AppTheme.neonCyan).withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isJourneyActive ? Icons.directions_walk_rounded : Icons.shield_rounded,
                          color: _isJourneyActive ? AppTheme.safeEmerald : AppTheme.neonCyan,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isJourneyActive ? 'LIVE TRACKING ACTIVE' : 'VIRTUAL ESCORT MODE',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: _isJourneyActive ? AppTheme.safeEmerald : AppTheme.neonCyan,
                                letterSpacing: 1.1,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _isJourneyActive
                                  ? 'Guardians are monitoring your live route in real time'
                                  : 'Set estimated travel duration. Auto-SOS if you don\'t check in.',
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  if (_isJourneyActive) ...[
                    const SizedBox(height: 24),
                    Text(
                      _formatDuration(_remainingSeconds),
                      style: GoogleFonts.robotoMono(
                        fontSize: 48,
                        fontWeight: FontWeight.w900,
                        color: _remainingSeconds < 120 ? AppTheme.primaryRed : AppTheme.safeEmerald,
                      ),
                    ),
                    Text(
                      'REMAINING TIME UNTIL CHECK-IN',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _finishJourneySafe,
                            icon: const Icon(Icons.check_circle_rounded, color: Colors.black),
                            label: const Text('I Have Arrived Safely', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.safeEmerald,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            if (!_isJourneyActive) ...[
              Text(
                'DESTINATION & ROUTE',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),

              GlassCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _destinationCtrl,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        labelText: 'Where are you heading?',
                        prefixIcon: const Icon(Icons.navigation_rounded, color: AppTheme.neonCyan),
                        filled: true,
                        fillColor: AppTheme.surface,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.location_pin, color: AppTheme.safeEmerald, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Current GPS: ${sos.locationService.currentAddress}',
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              Text(
                'ESTIMATED TRIP TIME',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textMuted,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: _presetMinutes.map((mins) {
                  final isSel = _selectedMinutes == mins;
                  return InkWell(
                    onTap: () => setState(() => _selectedMinutes = mins),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      decoration: BoxDecoration(
                        color: isSel ? AppTheme.neonCyan.withValues(alpha: 0.15) : AppTheme.surfaceCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSel ? AppTheme.neonCyan : Colors.white12,
                          width: isSel ? 1.8 : 1,
                        ),
                      ),
                      child: Text(
                        '$mins Mins',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                          color: isSel ? AppTheme.neonCyan : Colors.white,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _startJourney,
                  icon: const Icon(Icons.directions_walk_rounded, color: Colors.black, size: 22),
                  label: Text(
                    'START VIRTUAL WALK COMPANION',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      letterSpacing: 0.5,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.neonCyan,
                    elevation: 8,
                    shadowColor: AppTheme.neonCyan.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Guardian sync status
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.people_alt_rounded, color: AppTheme.safeEmerald, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${contacts.contacts.length} Guardians in Live Sync',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                        Text(
                          'All guardians will receive SMS link & live GPS coords.',
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
