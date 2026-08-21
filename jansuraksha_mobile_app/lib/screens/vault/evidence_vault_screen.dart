import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class EvidenceVaultScreen extends StatelessWidget {
  const EvidenceVaultScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mockEvidence = [
      {
        'title': 'Emergency SOS Audio Capture #104',
        'date': 'Today, 08:34 PM',
        'duration': '0:45 min',
        'type': 'Audio',
        'size': '1.2 MB',
        'encrypted': true,
      },
      {
        'title': 'GPS Location Route Blackbox',
        'date': 'Yesterday, 10:12 PM',
        'duration': '14 Points',
        'type': 'GPS Telemetry',
        'size': '240 KB',
        'encrypted': true,
      },
      {
        'title': 'Background Ambient Snapshot',
        'date': '18 Aug 2026',
        'duration': '3 Photos',
        'type': 'Images',
        'size': '3.8 MB',
        'encrypted': true,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Encrypted Evidence Vault'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            GlassCard(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blueAccent.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.lock_rounded, color: Colors.blueAccent, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '256-Bit Hardware Encrypted',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'All emergency recordings, audio streams, and blackbox telemetry are tamper-proof.',
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'INCIDENT RECORDINGS & LOGS',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            ...mockEvidence.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          item['type'] == 'Audio'
                              ? Icons.audiotrack_rounded
                              : (item['type'] == 'Images' ? Icons.image_rounded : Icons.route_rounded),
                          color: AppTheme.neonCyan,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title'] as String,
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item['date']} • ${item['duration']} • ${item['size']}',
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.download_rounded, color: AppTheme.safeEmerald, size: 20),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Exporting decrypted legal evidence package...'), backgroundColor: AppTheme.safeEmerald),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
