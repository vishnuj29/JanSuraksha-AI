import 'dart:async';
import 'dart:math';
import 'package:sensors_plus/sensors_plus.dart';

class ShakeDetectorService {
  StreamSubscription? _accelerometerSubscription;
  bool _isListening = false;
  
  // Acceleration threshold (g-force) for detecting vigorous emergency shaking
  double shakeThresholdGravity = 2.7;
  int minTimeBetweenShakesMs = 1500;
  DateTime _lastShakeTime = DateTime.now();

  Function()? onShakeDetected;

  bool get isListening => _isListening;

  void startListening({Function()? onShake}) {
    if (_isListening) return;
    onShakeDetected = onShake;
    _isListening = true;

    try {
      _accelerometerSubscription = accelerometerEventStream().listen(
        (AccelerometerEvent event) {
          final double gX = event.x / 9.80665;
          final double gY = event.y / 9.80665;
          final double gZ = event.z / 9.80665;

          // g-Force will be close to 1 when stationary
          final double gForce = sqrt(gX * gX + gY * gY + gZ * gZ);

          if (gForce > shakeThresholdGravity) {
            final now = DateTime.now();
            if (now.difference(_lastShakeTime).inMilliseconds > minTimeBetweenShakesMs) {
              _lastShakeTime = now;
              onShakeDetected?.call();
            }
          }
        },
        onError: (_) {},
      );
    } catch (_) {}
  }

  void stopListening() {
    _isListening = false;
    _accelerometerSubscription?.cancel();
    _accelerometerSubscription = null;
  }

  void simulateShake() {
    onShakeDetected?.call();
  }
}
