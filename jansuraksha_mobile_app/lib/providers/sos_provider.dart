import 'dart:async';
import 'package:flutter/material.dart';
import '../models/sos_alert_model.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/offline_sms_service.dart';

class SosProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final LocationService locationService = LocationService();

  bool _isSosActive = false;
  bool _isCountingDown = false;
  int _countdownSeconds = 5;
  Timer? _countdownTimer;
  Timer? _responderTimer;

  SosAlertModel? _activeAlert;
  int _activeResponders = 0;
  String _sosTriggerType = 'Manual SOS';

  bool get isSosActive => _isSosActive;
  bool get isCountingDown => _isCountingDown;
  int get countdownSeconds => _countdownSeconds;
  SosAlertModel? get activeAlert => _activeAlert;
  int get activeResponders => _activeResponders;
  String get sosTriggerType => _sosTriggerType;

  SosProvider() {
    locationService.getCurrentLocation();
  }

  void initiateSos({String triggerType = 'Manual SOS', String? triggerWord}) {
    if (_isSosActive || _isCountingDown) return;

    _sosTriggerType = triggerType;
    _isCountingDown = true;
    _countdownSeconds = 5;
    notifyListeners();

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdownSeconds > 1) {
        _countdownSeconds--;
        notifyListeners();
      } else {
        _countdownTimer?.cancel();
        _isCountingDown = false;
        _dispatchSos(triggerType, triggerWord);
      }
    });
  }

  void cancelCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = null;
    _isCountingDown = false;
    _countdownSeconds = 5;
    notifyListeners();
  }

  Future<void> _dispatchSos(String type, String? triggerWord) async {
    _isSosActive = true;
    _activeResponders = 1;
    notifyListeners();

    final pos = await locationService.getCurrentLocation();
    final lat = pos?.latitude ?? 28.6139;
    final lng = pos?.longitude ?? 77.2090;

    _activeAlert = SosAlertModel(
      id: 'sos-${DateTime.now().millisecondsSinceEpoch}',
      user: 'Priya Sharma',
      phone: '+91 98765 43210',
      type: type,
      time: 'Just now',
      location: locationService.currentAddress,
      latitude: lat,
      longitude: lng,
      status: 'Active',
      responders: 4,
      triggerWord: triggerWord,
    );

    notifyListeners();

    _apiService.triggerSos(
      user: _activeAlert!.user,
      phone: _activeAlert!.phone,
      location: _activeAlert!.location,
      latitude: lat,
      longitude: lng,
      type: type,
      triggerWord: triggerWord,
    );

    _responderTimer?.cancel();
    _responderTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_isSosActive && _activeResponders < 7) {
        _activeResponders++;
        notifyListeners();
      } else {
        timer.cancel();
      }
    });
  }

  void resolveSos() {
    _isSosActive = false;
    _activeAlert = null;
    _activeResponders = 0;
    _countdownTimer?.cancel();
    _responderTimer?.cancel();
    notifyListeners();
  }

  Future<void> broadcastOfflineSms(List<String> phoneNumbers, String userName) async {
    final pos = locationService.currentPosition;
    final lat = pos?.latitude ?? 28.6139;
    final lng = pos?.longitude ?? 77.2090;

    await OfflineSmsService.sendEmergencySms(
      phoneNumbers: phoneNumbers,
      latitude: lat,
      longitude: lng,
      userName: userName,
    );
  }
}
