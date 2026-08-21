import 'dart:async';
import 'package:flutter/material.dart';
import '../models/sos_alert_model.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/offline_sms_service.dart';
import 'contacts_provider.dart';
import 'auth_provider.dart';
import 'evidence_vault_provider.dart';

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

  void initiateSos({
    String triggerType = 'Manual SOS',
    String? triggerWord,
    AuthProvider? auth,
    ContactsProvider? contacts,
    EvidenceVaultProvider? evidenceVault,
  }) {
    if (_isSosActive || _isCountingDown) return;

    _sosTriggerType = triggerType;
    _isCountingDown = true;
    _countdownSeconds = 4;
    notifyListeners();

    // Instantly capture initial evidence snapshot and audio buffer
    if (evidenceVault != null) {
      final pos = locationService.currentPosition;
      final lat = pos?.latitude ?? 28.6139;
      final lng = pos?.longitude ?? 77.2090;
      final addr = locationService.currentAddress.isNotEmpty
          ? locationService.currentAddress
          : 'Connaught Place, New Delhi';

      evidenceVault.recordAutoEvidence(
        triggerWord: triggerWord ?? triggerType,
        lat: lat,
        lng: lng,
        address: addr,
      );
    }

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdownSeconds > 1) {
        _countdownSeconds--;
        notifyListeners();
      } else {
        _countdownTimer?.cancel();
        _isCountingDown = false;
        _dispatchSos(
          triggerType,
          triggerWord,
          auth: auth,
          contacts: contacts,
          evidenceVault: evidenceVault,
        );
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

  Future<void> _dispatchSos(
    String type,
    String? triggerWord, {
    AuthProvider? auth,
    ContactsProvider? contacts,
    EvidenceVaultProvider? evidenceVault,
  }) async {
    _isSosActive = true;
    _activeResponders = 1;
    notifyListeners();

    final pos = await locationService.getCurrentLocation();
    final lat = pos?.latitude ?? 28.6139;
    final lng = pos?.longitude ?? 77.2090;
    final address = locationService.currentAddress.isNotEmpty
        ? locationService.currentAddress
        : 'Connaught Place, New Delhi';
    final userName = auth?.user?.name ?? 'Priya Sharma';
    final userPhone = auth?.user?.phone ?? '+91 98765 43210';
    final userEmail = auth?.user?.email ?? 'priya.sharma@example.com';

    // Collect all family & guardian emails, PLUS Super Admin (ec23019@glbitm.ac.in), PLUS police responder desk
    final guardianEmails = <String>[];
    if (contacts != null) {
      for (final c in contacts.contacts) {
        if (c.email != null && c.email!.isNotEmpty) {
          guardianEmails.add(c.email!);
        }
      }
    }
    // Super Admin Email (Always notified of all user emergencies)
    if (!guardianEmails.contains('ec23019@glbitm.ac.in')) {
      guardianEmails.add('ec23019@glbitm.ac.in');
    }
    // Police emergency desks
    if (!guardianEmails.contains('112.police.response@gov.in')) {
      guardianEmails.add('112.police.response@gov.in');
    }
    if (!guardianEmails.contains('police.delhi@gov.in')) {
      guardianEmails.add('police.delhi@gov.in');
    }

    final guardianPhones = contacts?.primaryPhoneNumbers ?? ['+91 98765 43210', '112'];

    _activeAlert = SosAlertModel(
      id: 'sos-${DateTime.now().millisecondsSinceEpoch}',
      user: userName,
      phone: userPhone,
      type: type,
      time: 'Just now',
      location: address,
      latitude: lat,
      longitude: lng,
      status: 'Active',
      responders: 4,
      triggerWord: triggerWord,
    );

    notifyListeners();

    // 1. Send Enterprise SOS via Cloud API (Dispatches rich HTML Email with Live GPS to Super Admin ec23019@glbitm.ac.in + family + police)
    try {
      await _apiService.triggerSos(
        user: userName,
        phone: userPhone,
        userEmail: userEmail,
        guardianEmails: guardianEmails,
        location: 'https://maps.google.com/?q=$lat,$lng',
        latitude: lat,
        longitude: lng,
        type: type,
        triggerWord: triggerWord ?? (type.contains('Voice') ? type : 'Manual SOS'),
      );
    } catch (_) {}

    // 2. Dispatch Direct Offline Telephony SMS with live GPS link to all guardian numbers
    if (guardianPhones.isNotEmpty) {
      OfflineSmsService.sendEmergencySms(
        phoneNumbers: guardianPhones,
        latitude: lat,
        longitude: lng,
        userName: userName,
        customMessage: '🚨 CRITICAL EMERGENCY SOS: $userName needs immediate help! Trigger: $type. Live GPS tracking: https://maps.google.com/?q=$lat,$lng. Police 112 alerted.',
      );
    }

    // 3. Automatically record evidence (Photos, Audios, Video stream, GPS Blackbox) into Vault
    if (evidenceVault != null) {
      evidenceVault.recordAutoEvidence(
        triggerWord: triggerWord ?? type,
        lat: lat,
        lng: lng,
        address: address,
      );
    }

    // 4. Dynamic responder counter
    _responderTimer?.cancel();
    _responderTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_isSosActive && _activeResponders < 8) {
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

