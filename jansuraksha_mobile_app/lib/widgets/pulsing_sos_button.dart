import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class PulsingSosButton extends StatefulWidget {
  final VoidCallback onTap;
  final bool isCountingDown;
  final int countdownSeconds;
  final VoidCallback onCancelCountdown;

  const PulsingSosButton({
    super.key,
    required this.onTap,
    this.isCountingDown = false,
    this.countdownSeconds = 5,
    required this.onCancelCountdown,
  });

  @override
  State<PulsingSosButton> createState() => _PulsingSosButtonState();
}

class _PulsingSosButtonState extends State<PulsingSosButton> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isCountingDown) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 210,
            height: 210,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryRedDark,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryRed.withValues(alpha: 0.6),
                  blurRadius: 32,
                  spreadRadius: 8,
                ),
              ],
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${widget.countdownSeconds}',
                    style: GoogleFonts.inter(
                      fontSize: 64,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      height: 1,
                    ),
                  ).animate(key: ValueKey(widget.countdownSeconds)).scale(duration: 200.ms),
                  const SizedBox(height: 6),
                  Text(
                    'DISPATCHING SOS...',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white70,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: widget.onCancelCountdown,
            icon: const Icon(Icons.close, color: Colors.white, size: 18),
            label: const Text('CANCEL SOS (False Alarm)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white24,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            ),
          ),
        ],
      );
    }

    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          final pulseValue = _pulseController.value;
          return Stack(
            alignment: Alignment.center,
            children: [
              // Outer Ripple Ring 2
              Container(
                width: 220 + (pulseValue * 40),
                height: 220 + (pulseValue * 40),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryRed.withValues(alpha: (1 - pulseValue) * 0.15),
                ),
              ),
              // Outer Ripple Ring 1
              Container(
                width: 190 + (pulseValue * 25),
                height: 190 + (pulseValue * 25),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryRed.withValues(alpha: (1 - pulseValue) * 0.3),
                ),
              ),
              // Glowing Main Button
              Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppTheme.sosGradient,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryRed.withValues(alpha: 0.5),
                      blurRadius: 28,
                      spreadRadius: 4,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.touch_app_rounded, color: Colors.white, size: 38)
                          .animate(onPlay: (controller) => controller.repeat(reverse: true))
                          .scale(duration: 800.ms, begin: const Offset(1, 1), end: const Offset(1.15, 1.15)),
                      const SizedBox(height: 4),
                      Text(
                        'EMERGENCY',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white70,
                          letterSpacing: 2,
                        ),
                      ),
                      Text(
                        'SOS',
                        style: GoogleFonts.inter(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
