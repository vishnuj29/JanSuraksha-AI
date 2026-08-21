import 'package:flutter/material.dart';
import '../services/voice_trigger_service.dart';
import '../services/shake_detector_service.dart';

class VoiceProvider with ChangeNotifier {
  final VoiceTriggerService voiceService = VoiceTriggerService();
  final ShakeDetectorService shakeService = ShakeDetectorService();

  bool _isVoiceEnabled = true;
  bool _isShakeEnabled = true;
  String _sensitivity = 'High';
  String _customKeyword = 'JanSuraksha';
  String? _lastDetectedTrigger;

  bool get isVoiceEnabled => _isVoiceEnabled;
  bool get isShakeEnabled => _isShakeEnabled;
  String get sensitivity => _sensitivity;
  String get customKeyword => _customKeyword;
  String? get lastDetectedTrigger => _lastDetectedTrigger;

  Function(String keyword)? onEmergencyTrigger;

  void initializeTriggers({required Function(String keyword) onTrigger}) {
    onEmergencyTrigger = onTrigger;

    if (_isVoiceEnabled) {
      voiceService.startListening(
        onTrigger: (word) {
          _lastDetectedTrigger = word;
          notifyListeners();
          onEmergencyTrigger?.call(word);
        },
      );
    }

    if (_isShakeEnabled) {
      shakeService.startListening(
        onShake: () {
          _lastDetectedTrigger = 'Aggressive Shake Detection';
          notifyListeners();
          onEmergencyTrigger?.call('Shake Detected');
        },
      );
    }
  }

  void toggleVoice(bool value) {
    _isVoiceEnabled = value;
    if (_isVoiceEnabled) {
      voiceService.startListening(
        onTrigger: (word) {
          _lastDetectedTrigger = word;
          notifyListeners();
          onEmergencyTrigger?.call(word);
        },
      );
    } else {
      voiceService.stopListening();
    }
    notifyListeners();
  }

  void toggleShake(bool value) {
    _isShakeEnabled = value;
    if (_isShakeEnabled) {
      shakeService.startListening(
        onShake: () {
          _lastDetectedTrigger = 'Aggressive Shake';
          notifyListeners();
          onEmergencyTrigger?.call('Shake Detected');
        },
      );
    } else {
      shakeService.stopListening();
    }
    notifyListeners();
  }

  void updateKeyword(String newKeyword) {
    _customKeyword = newKeyword;
    if (!voiceService.triggerWords.contains(newKeyword.toLowerCase())) {
      voiceService.triggerWords.add(newKeyword.toLowerCase());
    }
    notifyListeners();
  }

  void setSensitivity(String s) {
    _sensitivity = s;
    if (s == 'High') {
      shakeService.shakeThresholdGravity = 2.4;
    } else if (s == 'Medium') {
      shakeService.shakeThresholdGravity = 2.8;
    } else {
      shakeService.shakeThresholdGravity = 3.5;
    }
    notifyListeners();
  }
}
