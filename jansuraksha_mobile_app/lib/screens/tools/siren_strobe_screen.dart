import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/siren_service.dart';
import '../../theme/app_theme.dart';

class SirenStrobeScreen extends StatefulWidget {
  const SirenStrobeScreen({super.key});

  @override
  State<SirenStrobeScreen> createState() => _SirenStrobeScreenState();
}

class _SirenStrobeScreenState extends State<SirenStrobeScreen> {
  final SirenService _sirenService = SirenService();
  bool _isStrobeRed = false;

  @override
  void initState() {
    super.initState();
    _startSiren();
  }

  void _startSiren() {
    _sirenService.startSiren(
      strobeCallback: (isRed) {
        if (mounted) setState(() => _isStrobeRed = isRed);
      },
    );
  }

  @override
  void dispose() {
    _sirenService.stopSiren();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _sirenService.isPlaying
        ? (_isStrobeRed ? const Color(0xFFEF4444) : const Color(0xFF2563EB))
        : AppTheme.background;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('High-Decibel Siren & Strobe'),
      ),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.2),
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: const Icon(
                  Icons.notifications_active_rounded,
                  color: Colors.white,
                  size: 72,
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(duration: 400.ms, begin: const Offset(1, 1), end: const Offset(1.15, 1.15)),

              const SizedBox(height: 36),

              Text(
                'LOUD EMERGENCY SIREN',
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 8),

              Text(
                '110 dB Acoustic Deterrent & Strobe Flasher',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),

              const SizedBox(height: 48),

              ElevatedButton.icon(
                onPressed: () {
                  if (_sirenService.isPlaying) {
                    _sirenService.stopSiren();
                    setState(() {});
                  } else {
                    _startSiren();
                  }
                },
                icon: Icon(
                  _sirenService.isPlaying ? Icons.stop_rounded : Icons.play_arrow_rounded,
                  color: _sirenService.isPlaying ? Colors.white : AppTheme.primaryRed,
                  size: 24,
                ),
                label: Text(
                  _sirenService.isPlaying ? 'SILENCE ALARM' : 'ACTIVATE SIREN',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: _sirenService.isPlaying ? Colors.white : AppTheme.primaryRed,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _sirenService.isPlaying ? Colors.black87 : Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  elevation: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
