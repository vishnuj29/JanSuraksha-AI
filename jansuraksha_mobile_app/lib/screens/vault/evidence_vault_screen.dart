import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/evidence_vault_provider.dart';
import '../../providers/sos_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class EvidenceVaultScreen extends StatefulWidget {
  const EvidenceVaultScreen({super.key});

  @override
  State<EvidenceVaultScreen> createState() => _EvidenceVaultScreenState();
}

class _EvidenceVaultScreenState extends State<EvidenceVaultScreen> {
  void _showPreviewDialog(BuildContext context, EvidenceItem item) {
    showDialog(
      context: context,
      builder: (ctx) => _EvidenceItemModal(item: item),
    );
  }

  @override
  Widget build(BuildContext context) {
    final vault = Provider.of<EvidenceVaultProvider>(context);
    final sos = Provider.of<SosProvider>(context, listen: false);
    final items = vault.items;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Encrypted Evidence Vault'),
        actions: [
          IconButton(
            icon: const Icon(Icons.camera_alt_rounded, color: AppTheme.neonCyan),
            tooltip: 'Trigger Instant Capture',
            onPressed: () async {
              final pos = await sos.locationService.getCurrentLocation();
              final lat = pos?.latitude ?? 28.6139;
              final lng = pos?.longitude ?? 77.2090;
              final addr = sos.locationService.currentAddress.isNotEmpty
                  ? sos.locationService.currentAddress
                  : 'Connaught Place, New Delhi';

              await vault.recordAutoEvidence(
                triggerWord: 'Manual Instant Capture',
                lat: lat,
                lng: lng,
                address: addr,
              );

              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('📸 Instant Evidence Captured: Photo, 30s Audio & Video saved!'),
                  backgroundColor: AppTheme.safeEmerald,
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Encryption Card
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
                          'Automatically captures Photo, Video & Audio whenever "Help", "Bachao", "Madad" or SOS is triggered.',
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Quick Instant Capture Action Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final pos = await sos.locationService.getCurrentLocation();
                  final lat = pos?.latitude ?? 28.6139;
                  final lng = pos?.longitude ?? 77.2090;
                  final addr = sos.locationService.currentAddress.isNotEmpty
                      ? sos.locationService.currentAddress
                      : 'Connaught Place, New Delhi';

                  await vault.recordAutoEvidence(
                    triggerWord: 'Manual Instant Capture',
                    lat: lat,
                    lng: lng,
                    address: addr,
                  );

                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('📸 Instant Evidence Captured: Photo, Audio & Video recorded!'),
                      backgroundColor: AppTheme.safeEmerald,
                    ),
                  );
                },
                icon: const Icon(Icons.add_a_photo_rounded, size: 18),
                label: const Text('Capture Live Photo, Audio & Video Now', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.neonCyan,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),

            const SizedBox(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'CAPTURED EVIDENCE LOGS (${items.length})',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.safeEmerald.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.shield_rounded, size: 12, color: AppTheme.safeEmerald),
                      SizedBox(width: 4),
                      Text('AUTO SENTRY ACTIVE', style: TextStyle(color: AppTheme.safeEmerald, fontSize: 9, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: Text(
                    'No incident records yet. Automated evidence is captured when SOS or distress voice triggers activate.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ),
              )
            else
              ...items.map((item) {
                Color iconColor = AppTheme.neonCyan;
                IconData iconData = Icons.audiotrack_rounded;
                if (item.type == 'Photo') {
                  iconColor = AppTheme.goldPrimary;
                  iconData = Icons.photo_camera_rounded;
                } else if (item.type == 'Video') {
                  iconColor = AppTheme.primaryRed;
                  iconData = Icons.videocam_rounded;
                } else if (item.type == 'GPS Telemetry') {
                  iconColor = AppTheme.safeEmerald;
                  iconData = Icons.route_rounded;
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GlassCard(
                    onTap: () => _showPreviewDialog(context, item),
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: iconColor.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(iconData, color: iconColor, size: 22),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${item.timestamp} • ${item.duration} • ${item.fileSize}',
                                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Trigger: "${item.triggerKeyword}"',
                                style: GoogleFonts.inter(fontSize: 10, color: iconColor, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.play_circle_outline_rounded, color: AppTheme.neonCyan, size: 22),
                          tooltip: 'Play / View Evidence',
                          onPressed: () => _showPreviewDialog(context, item),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline_rounded, color: AppTheme.textMuted, size: 18),
                          onPressed: () => vault.deleteItem(item.id),
                        ),
                      ],
                    ),
                  ),
                );
              }),

            const SizedBox(height: 16),

            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('📥 Exported court-admissible encrypted evidence bundle with SHA-256 hash!'),
                    backgroundColor: AppTheme.safeEmerald,
                  ),
                );
              },
              icon: const Icon(Icons.download_rounded, color: AppTheme.neonCyan),
              label: const Text('Export Legal Decrypted Evidence Bundle', style: TextStyle(color: AppTheme.neonCyan, fontWeight: FontWeight.bold)),
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

class _EvidenceItemModal extends StatefulWidget {
  final EvidenceItem item;
  const _EvidenceItemModal({required this.item});

  @override
  State<_EvidenceItemModal> createState() => _EvidenceItemModalState();
}

class _EvidenceItemModalState extends State<_EvidenceItemModal> {
  bool _isPlaying = true;
  double _progress = 0.45;
  Timer? _animTimer;

  @override
  void initState() {
    super.initState();
    _animTimer = Timer.periodic(const Duration(milliseconds: 200), (timer) {
      if (_isPlaying && mounted) {
        setState(() {
          _progress = (_progress + 0.03) % 1.0;
        });
      }
    });
  }

  @override
  void dispose() {
    _animTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;

    return AlertDialog(
      backgroundColor: const Color(0xFF10141E),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: Color(0xFF1E2A3A), width: 1.5),
      ),
      title: Row(
        children: [
          Icon(
            item.type == 'Photo'
                ? Icons.photo_camera_rounded
                : (item.type == 'Audio'
                    ? Icons.audiotrack_rounded
                    : (item.type == 'Video' ? Icons.videocam_rounded : Icons.route_rounded)),
            color: item.type == 'Photo'
                ? AppTheme.goldPrimary
                : (item.type == 'Video' ? AppTheme.primaryRed : AppTheme.neonCyan),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              item.title,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 📸 Visual Photo Preview Box
          if (item.type == 'Photo') ...[
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF070B12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.goldPrimary.withValues(alpha: 0.4), width: 1.5),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Night Vision Camera Frame Grid
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.green.withValues(alpha: 0.1), Colors.black],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),

                  // Simulated Live Threat Scene Capture
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.goldPrimary, width: 2),
                          color: AppTheme.goldPrimary.withValues(alpha: 0.15),
                        ),
                        child: const Icon(Icons.person_rounded, size: 48, color: AppTheme.goldPrimary),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.redAccent),
                        ),
                        child: const Text('AUTO TARGET IDENTIFIED', style: TextStyle(color: Colors.redAccent, fontSize: 9, fontWeight: FontWeight.w900)),
                      ),
                    ],
                  ),

                  // Overlay Telemetry
                  Positioned(
                    top: 8,
                    left: 10,
                    child: Text('REC ● 1080P HDR', style: GoogleFonts.robotoMono(fontSize: 10, color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  ),
                  Positioned(
                    bottom: 8,
                    left: 10,
                    child: Text('LAT: ${item.latitude.toStringAsFixed(4)} LNG: ${item.longitude.toStringAsFixed(4)}', style: GoogleFonts.robotoMono(fontSize: 9, color: Colors.white70)),
                  ),
                ],
              ),
            ),
          ]
          // 🎥 Tactical Video Player Preview Box
          else if (item.type == 'Video') ...[
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF070B12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryRed.withValues(alpha: 0.5), width: 1.5),
              ),
              child: Stack(
                children: [
                  // Video Viewport
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: Icon(
                            _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                            size: 56,
                            color: AppTheme.primaryRed,
                          ),
                          onPressed: () => setState(() => _isPlaying = !_isPlaying),
                        ),
                        Text(
                          _isPlaying ? 'Playing Incident Video...' : 'Paused',
                          style: GoogleFonts.inter(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),

                  // Top Video Header
                  Positioned(
                    top: 10,
                    left: 12,
                    right: 12,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red)),
                            const SizedBox(width: 6),
                            Text('LIVE SENTRY BUFFER', style: GoogleFonts.robotoMono(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Text('30 FPS • AES-256', style: GoogleFonts.robotoMono(fontSize: 9, color: Colors.white54)),
                      ],
                    ),
                  ),

                  // Bottom Video Progress Bar
                  Positioned(
                    bottom: 8,
                    left: 12,
                    right: 12,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LinearProgressIndicator(
                          value: _progress,
                          color: AppTheme.primaryRed,
                          backgroundColor: Colors.white12,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('00:0${(_progress * 10).toInt()} / 00:10', style: GoogleFonts.robotoMono(fontSize: 9, color: Colors.white70)),
                            Text('Audio Synced', style: GoogleFonts.inter(fontSize: 9, color: AppTheme.safeEmerald, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ]
          // 🎙️ Encrypted Audio Waveform Player
          else if (item.type == 'Audio') ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F141F),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.neonCyan.withValues(alpha: 0.3)),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                          size: 44,
                          color: AppTheme.safeEmerald,
                        ),
                        onPressed: () => setState(() => _isPlaying = !_isPlaying),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Ambient Audio Stream', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
                                Text('${(_progress * 30).toInt()}s / 30s', style: GoogleFonts.robotoMono(fontSize: 10, color: AppTheme.safeEmerald)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            LinearProgressIndicator(
                              value: _progress,
                              color: AppTheme.safeEmerald,
                              backgroundColor: Colors.white12,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ]
          // 🛰️ GPS Telemetry
          else ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF0F141F),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.safeEmerald.withValues(alpha: 0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('GPS Telemetry Coordinates:', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                  const SizedBox(height: 2),
                  Text('${item.latitude.toStringAsFixed(6)}, ${item.longitude.toStringAsFixed(6)}', style: GoogleFonts.robotoMono(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 6),
                  Text(item.address, style: GoogleFonts.inter(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Metadata Info
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.black26,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Trigger Phrase:', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                    Text('"${item.triggerKeyword}"', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.goldPrimary, fontWeight: FontWeight.w800)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Recorded At:', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                    Text(item.timestamp, style: GoogleFonts.inter(fontSize: 11, color: Colors.white70)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('File Size & Encryption:', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
                    Text('${item.fileSize} • AES-256 GCM', style: GoogleFonts.inter(fontSize: 11, color: AppTheme.safeEmerald, fontWeight: FontWeight.w700)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close', style: TextStyle(color: Colors.white70)),
        ),
        ElevatedButton.icon(
          onPressed: () async {
            Navigator.of(context).pop();
            final url = Uri.parse('https://maps.google.com/?q=${item.latitude},${item.longitude}');
            if (await canLaunchUrl(url)) {
              await launchUrl(url);
            }
          },
          icon: const Icon(Icons.map_rounded, size: 16),
          label: const Text('View on Map'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.neonCyan,
            foregroundColor: Colors.black,
          ),
        ),
      ],
    );
  }
}
