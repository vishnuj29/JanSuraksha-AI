import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'glass_card.dart';

class SafetyRadarWidget extends StatefulWidget {
  final int safetyScore;
  final String location;
  final VoidCallback onOpenMap;

  const SafetyRadarWidget({
    super.key,
    required this.safetyScore,
    required this.location,
    required this.onOpenMap,
  });

  @override
  State<SafetyRadarWidget> createState() => _SafetyRadarWidgetState();
}

class _SafetyRadarWidgetState extends State<SafetyRadarWidget> with SingleTickerProviderStateMixin {
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _radarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      onTap: widget.onOpenMap,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.surface,
                  border: Border.all(color: AppTheme.safeEmerald.withValues(alpha: 0.3)),
                ),
              ),
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.safeEmerald.withValues(alpha: 0.2)),
                ),
              ),
              AnimatedBuilder(
                animation: _radarController,
                builder: (context, child) {
                  return Transform.rotate(
                    angle: _radarController.value * 2 * pi,
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: SweepGradient(
                          center: Alignment.center,
                          colors: [
                            Colors.transparent,
                            AppTheme.safeEmerald.withValues(alpha: 0.35),
                          ],
                          stops: const [0.75, 1.0],
                        ),
                      ),
                    ),
                  );
                },
              ),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.safeEmerald,
                  boxShadow: [
                    BoxShadow(color: AppTheme.safeEmerald, blurRadius: 6, spreadRadius: 2),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.safeEmerald,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'LIVE THREAT RADAR',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.safeEmerald,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.safeEmerald.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.safeEmerald.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        '${widget.safetyScore}% Safe',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.safeEmerald,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  widget.location,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      'Tap to view danger zones & police posts',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
