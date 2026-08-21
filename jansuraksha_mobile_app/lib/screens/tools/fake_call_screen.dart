import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

class FakeCallScreen extends StatefulWidget {
  final String callerName;
  final String callerNumber;

  const FakeCallScreen({
    super.key,
    this.callerName = 'Mom',
    this.callerNumber = '+91 98765 43210',
  });

  @override
  State<FakeCallScreen> createState() => _FakeCallScreenState();
}

class _FakeCallScreenState extends State<FakeCallScreen> {
  bool _isCallAnswered = false;
  int _callDurationSeconds = 0;
  Timer? _callTimer;

  @override
  void dispose() {
    _callTimer?.cancel();
    super.dispose();
  }

  void _answerCall() {
    setState(() => _isCallAnswered = true);
    _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _callDurationSeconds++);
    });
  }

  void _endCall() {
    _callTimer?.cancel();
    Navigator.of(context).pop();
  }

  String _formatDuration(int totalSeconds) {
    final m = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 48),

            // Caller Avatar
            CircleAvatar(
              radius: 56,
              backgroundColor: Colors.white12,
              child: const Icon(Icons.person_rounded, size: 64, color: Colors.white70),
            ).animate(onPlay: (c) => _isCallAnswered ? null : c.repeat(reverse: true))
                .scale(duration: 900.ms, begin: const Offset(1, 1), end: const Offset(1.08, 1.08)),

            const SizedBox(height: 24),

            // Caller Name
            Text(
              widget.callerName,
              style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
            ),
            const SizedBox(height: 6),

            // Status / Number
            Text(
              _isCallAnswered ? _formatDuration(_callDurationSeconds) : 'Incoming Emergency Escape Call...',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: _isCallAnswered ? const Color(0xFF10B981) : Colors.white60,
              ),
            ),

            const Spacer(),

            // Actions
            if (!_isCallAnswered) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 36),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Decline
                    Column(
                      children: [
                        GestureDetector(
                          onTap: _endCall,
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFFEF4444),
                            ),
                            child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 36),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Decline', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),

                    // Accept
                    Column(
                      children: [
                        GestureDetector(
                          onTap: _answerCall,
                          child: Container(
                            width: 72,
                            height: 72,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF10B981),
                            ),
                            child: const Icon(Icons.call_rounded, color: Colors.white, size: 36),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Accept', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Active in-call action grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildCallTool(Icons.mic_off_rounded, 'Mute'),
                        _buildCallTool(Icons.dialpad_rounded, 'Keypad'),
                        _buildCallTool(Icons.volume_up_rounded, 'Speaker'),
                      ],
                    ),
                    const SizedBox(height: 36),
                    GestureDetector(
                      onTap: _endCall,
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFEF4444),
                        ),
                        child: const Icon(Icons.call_end_rounded, color: Colors.white, size: 36),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildCallTool(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.1),
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(height: 6),
        Text(label, style: GoogleFonts.inter(color: Colors.white70, fontSize: 11)),
      ],
    );
  }
}
