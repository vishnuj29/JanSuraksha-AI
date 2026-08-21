import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class EvidenceItem {
  final String id;
  final String title;
  final String type; // 'Photo', 'Audio', 'Video', 'GPS Telemetry'
  final String triggerKeyword;
  final String timestamp;
  final String fileSize;
  final String duration;
  final double latitude;
  final double longitude;
  final String address;
  final bool isEncrypted;

  EvidenceItem({
    required this.id,
    required this.title,
    required this.type,
    required this.triggerKeyword,
    required this.timestamp,
    required this.fileSize,
    required this.duration,
    required this.latitude,
    required this.longitude,
    required this.address,
    this.isEncrypted = true,
  });

  factory EvidenceItem.fromJson(Map<String, dynamic> json) {
    return EvidenceItem(
      id: json['id'] ?? 'ev-${DateTime.now().millisecondsSinceEpoch}',
      title: json['title'] ?? 'Encrypted Evidence',
      type: json['type'] ?? 'Audio',
      triggerKeyword: json['triggerKeyword'] ?? 'Emergency',
      timestamp: json['timestamp'] ?? 'Just now',
      fileSize: json['fileSize'] ?? '1.2 MB',
      duration: json['duration'] ?? '0:30 min',
      latitude: (json['latitude'] is num) ? (json['latitude'] as num).toDouble() : 28.6139,
      longitude: (json['longitude'] is num) ? (json['longitude'] as num).toDouble() : 77.2090,
      address: json['address'] ?? 'Live GPS Position',
      isEncrypted: json['isEncrypted'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'triggerKeyword': triggerKeyword,
      'timestamp': timestamp,
      'fileSize': fileSize,
      'duration': duration,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'isEncrypted': isEncrypted,
    };
  }
}

class EvidenceVaultProvider with ChangeNotifier {
  List<EvidenceItem> _items = [];
  bool _isAutoRecording = false;

  List<EvidenceItem> get items => _items;
  bool get isAutoRecording => _isAutoRecording;

  EvidenceVaultProvider() {
    _loadEvidence();
  }

  Future<void> _loadEvidence() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('vault_evidence_items');
    if (cached != null) {
      try {
        final List list = jsonDecode(cached);
        _items = list.map((item) => EvidenceItem.fromJson(item)).toList();
      } catch (_) {}
    } else {
      // Default initial legal evidence records
      _items = [
        EvidenceItem(
          id: 'ev-1',
          title: 'Emergency Audio Sentinel Stream',
          type: 'Audio',
          triggerKeyword: 'madad karo',
          timestamp: 'Today, 08:34 PM',
          fileSize: '1.2 MB',
          duration: '0:45 min',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Connaught Place, New Delhi',
        ),
        EvidenceItem(
          id: 'ev-2',
          title: 'Front Camera Threat Snapshot',
          type: 'Photo',
          triggerKeyword: 'bachao',
          timestamp: 'Today, 08:34 PM',
          fileSize: '2.4 MB',
          duration: '1 High-Res Photo',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Connaught Place, New Delhi',
        ),
        EvidenceItem(
          id: 'ev-3',
          title: 'Ambient Video Evidence Stream',
          type: 'Video',
          triggerKeyword: 'suraksha',
          timestamp: 'Yesterday, 10:12 PM',
          fileSize: '6.8 MB',
          duration: '0:15 min',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Barakhamba Road, New Delhi',
        ),
        EvidenceItem(
          id: 'ev-4',
          title: 'GPS Flight Blackbox Telemetry',
          type: 'GPS Telemetry',
          triggerKeyword: 'help',
          timestamp: 'Yesterday, 10:12 PM',
          fileSize: '280 KB',
          duration: '24 GPS Breadcrumbs',
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Barakhamba Road, New Delhi',
        ),
      ];
      _saveEvidence();
    }
    notifyListeners();
  }

  Future<void> recordAutoEvidence({
    required String triggerWord,
    required double lat,
    required double lng,
    required String address,
  }) async {
    _isAutoRecording = true;
    notifyListeners();

    final now = DateTime.now();
    final timeStr = DateFormat('dd MMM yyyy, hh:mm a').format(now);
    final idSuffix = now.millisecondsSinceEpoch;

    // Automatically generate 4 encrypted evidence assets:
    final newPhoto = EvidenceItem(
      id: 'photo-$idSuffix',
      title: 'Auto Front Camera Threat Capture ($triggerWord)',
      type: 'Photo',
      triggerKeyword: triggerWord,
      timestamp: timeStr,
      fileSize: '2.6 MB',
      duration: '1 Photo Snapshot',
      latitude: lat,
      longitude: lng,
      address: address,
    );

    final newAudio = EvidenceItem(
      id: 'audio-$idSuffix',
      title: 'Encrypted Audio Sentinel Recording ($triggerWord)',
      type: 'Audio',
      triggerKeyword: triggerWord,
      timestamp: timeStr,
      fileSize: '1.5 MB',
      duration: '0:30 min',
      latitude: lat,
      longitude: lng,
      address: address,
    );

    final newVideo = EvidenceItem(
      id: 'video-$idSuffix',
      title: 'Auto Tactical Video Buffer ($triggerWord)',
      type: 'Video',
      triggerKeyword: triggerWord,
      timestamp: timeStr,
      fileSize: '5.2 MB',
      duration: '0:10 min',
      latitude: lat,
      longitude: lng,
      address: address,
    );

    final newGps = EvidenceItem(
      id: 'gps-$idSuffix',
      title: 'Live GPS Blackbox Telemetry ($triggerWord)',
      type: 'GPS Telemetry',
      triggerKeyword: triggerWord,
      timestamp: timeStr,
      fileSize: '320 KB',
      duration: '30 GPS Points',
      latitude: lat,
      longitude: lng,
      address: address,
    );

    _items.insert(0, newPhoto);
    _items.insert(0, newAudio);
    _items.insert(0, newVideo);
    _items.insert(0, newGps);

    await _saveEvidence();
    _isAutoRecording = false;
    notifyListeners();
  }

  Future<void> deleteItem(String id) async {
    _items.removeWhere((item) => item.id == id);
    await _saveEvidence();
    notifyListeners();
  }

  Future<void> _saveEvidence() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_items.map((item) => item.toJson()).toList());
    await prefs.setString('vault_evidence_items', encoded);
  }
}
