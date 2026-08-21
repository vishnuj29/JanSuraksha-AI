import 'dart:async';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class VoiceTriggerService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _isAvailable = false;
  String _lastRecognizedWords = '';
  
  List<String> triggerWords = ['help', 'jansuraksha', 'bachao', 'emergency', 'police', 'save me', 'khatra'];
  
  Function(String triggerKeyword)? onTriggerDetected;

  bool get isListening => _isListening;
  String get lastRecognizedWords => _lastRecognizedWords;

  Future<bool> initialize() async {
    try {
      _isAvailable = await _speech.initialize(
        onError: (val) {
          _isListening = false;
        },
        onStatus: (val) {
          if (val == 'done' || val == 'notListening') {
            if (_isListening) {
              _startSpeechStream();
            }
          }
        },
      );
      return _isAvailable;
    } catch (e) {
      _isAvailable = false;
      return false;
    }
  }

  Future<void> startListening({Function(String triggerKeyword)? onTrigger}) async {
    onTriggerDetected = onTrigger;
    _isListening = true;

    if (!_isAvailable) {
      final init = await initialize();
      if (!init) {
        return;
      }
    }

    _startSpeechStream();
  }

  void _startSpeechStream() {
    if (!_isListening) return;

    try {
      _speech.listen(
        onResult: (val) {
          _lastRecognizedWords = val.recognizedWords.toLowerCase();
          _checkTriggers(_lastRecognizedWords);
        },
      );
    } catch (_) {}
  }

  void _checkTriggers(String words) {
    for (final trigger in triggerWords) {
      if (words.contains(trigger.toLowerCase())) {
        onTriggerDetected?.call(trigger);
        break;
      }
    }
  }

  Future<void> stopListening() async {
    _isListening = false;
    try {
      await _speech.stop();
    } catch (_) {}
  }

  void simulateVoiceTrigger(String keyword) {
    _lastRecognizedWords = keyword;
    onTriggerDetected?.call(keyword);
  }
}
