import 'dart:async';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class VoiceTriggerService {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _isAvailable = false;
  String _lastRecognizedWords = '';
  Timer? _restartTimer;
  
  List<String> triggerWords = [
    // English / Roman Hindi Keywords
    'help',
    'help me',
    'bachao',
    'bacho',
    'bachao bachao',
    'bachaoo',
    'madad',
    'madad karo',
    'suraksha',
    'jansuraksha',
    'emergency',
    'police',
    'save me',
    'khatra',
    'sos',
    'rescue',
    'danger',
    'sahayata',
    
    // Devanagari Hindi Script Keywords (Recognized by Indian Speech Engines)
    'बचाओ',
    'बचाओ बचाओ',
    'मदद',
    'मदद करो',
    'सुरक्षा',
    'जनसुरक्षा',
    'हेल्प',
    'पुलिस',
    'खतरा',
    'सहायता',
    'बचा लो',
  ];
  
  Function(String triggerKeyword)? onTriggerDetected;

  bool get isListening => _isListening;
  String get lastRecognizedWords => _lastRecognizedWords;

  Future<bool> initialize() async {
    try {
      _isAvailable = await _speech.initialize(
        onError: (val) {
          _scheduleRestart(800);
        },
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            _scheduleRestart(400);
          }
        },
      );
      return _isAvailable;
    } catch (e) {
      _isAvailable = false;
      return false;
    }
  }

  void _scheduleRestart(int delayMs) {
    if (!_isListening) return;
    _restartTimer?.cancel();
    _restartTimer = Timer(Duration(milliseconds: delayMs), () {
      if (_isListening && !_speech.isListening) {
        _startSpeechStream();
      }
    });
  }

  Future<void> startListening({Function(String triggerKeyword)? onTrigger}) async {
    if (onTrigger != null) {
      onTriggerDetected = onTrigger;
    }
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
        listenOptions: stt.SpeechListenOptions(
          listenMode: stt.ListenMode.dictation,
          partialResults: true,
          cancelOnError: false,
          pauseFor: const Duration(seconds: 3),
          listenFor: const Duration(seconds: 30),
        ),
        onResult: (val) {
          _lastRecognizedWords = val.recognizedWords.toLowerCase().trim();
          _checkTriggers(_lastRecognizedWords);
        },
      );

    } catch (_) {}
  }

  void _checkTriggers(String rawWords) {
    if (rawWords.isEmpty) return;
    final cleanInput = rawWords.toLowerCase().trim();

    // Word tokens
    final tokens = cleanInput.split(RegExp(r'\s+'));

    for (final trigger in triggerWords) {
      final cleanTrigger = trigger.toLowerCase().trim();
      
      // 1. Direct substring match
      if (cleanInput.contains(cleanTrigger)) {
        onTriggerDetected?.call(trigger);
        return;
      }

      // 2. Token match
      for (final token in tokens) {
        if (token == cleanTrigger || (cleanTrigger.length >= 4 && token.contains(cleanTrigger))) {
          onTriggerDetected?.call(trigger);
          return;
        }
      }
    }
  }

  Future<void> stopListening() async {
    _isListening = false;
    _restartTimer?.cancel();
    try {
      await _speech.stop();
    } catch (_) {}
  }

  void simulateVoiceTrigger(String keyword) {
    _lastRecognizedWords = keyword;
    onTriggerDetected?.call(keyword);
  }
}
