import 'dart:async';
import 'package:audioplayers/audioplayers.dart';

class SirenService {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  Timer? _strobeTimer;
  bool _strobeState = false;
  Function(bool isRed)? onStrobeToggle;

  bool get isPlaying => _isPlaying;

  Future<void> startSiren({Function(bool isRed)? strobeCallback}) async {
    _isPlaying = true;
    onStrobeToggle = strobeCallback;

    try {
      // Loop emergency alarm sound (using raw asset / online audio stream)
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(
        UrlSource('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3'),
      );
    } catch (_) {}

    // Flashing Strobe timer (alternates red and white every 150ms)
    _strobeTimer?.cancel();
    _strobeTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
      _strobeState = !_strobeState;
      onStrobeToggle?.call(_strobeState);
    });
  }

  Future<void> stopSiren() async {
    _isPlaying = false;
    _strobeTimer?.cancel();
    _strobeTimer = null;
    try {
      await _audioPlayer.stop();
    } catch (_) {}
  }
}
