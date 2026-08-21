class RiskZoneModel {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final String severity; // high, medium, low, safe
  final String description;
  final String incidentCount;

  RiskZoneModel({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.radiusMeters = 300,
    required this.severity,
    required this.description,
    this.incidentCount = '2 reports in last 24h',
  });

  factory RiskZoneModel.fromJson(Map<String, dynamic> json) {
    return RiskZoneModel(
      id: json['id']?.toString() ?? 'zone-',
      name: json['name']?.toString() ?? 'Monitored Zone',
      latitude: (json['lat'] ?? json['latitude'] as num?)?.toDouble() ?? 28.6139,
      longitude: (json['lng'] ?? json['longitude'] as num?)?.toDouble() ?? 77.2090,
      radiusMeters: (json['radius'] as num?)?.toDouble() ?? 300.0,
      severity: json['severity']?.toString().toLowerCase() ?? 'medium',
      description: json['description']?.toString() ?? 'Low-light zone reported by users',
      incidentCount: json['incidentCount']?.toString() ?? 'Monitored 24/7',
    );
  }
}
