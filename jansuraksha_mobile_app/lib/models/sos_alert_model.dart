class SosAlertModel {
  final String id;
  final String user;
  final String phone;
  final String type;
  final String time;
  final String location;
  final double? latitude;
  final double? longitude;
  final String status;
  final int responders;
  final String? message;
  final String? triggerWord;

  SosAlertModel({
    required this.id,
    required this.user,
    required this.phone,
    required this.type,
    required this.time,
    required this.location,
    this.latitude,
    this.longitude,
    this.status = 'Active',
    this.responders = 4,
    this.message,
    this.triggerWord,
  });

  factory SosAlertModel.fromJson(Map<String, dynamic> json) {
    double? lat;
    double? lng;
    if (json['coordinates'] is Map) {
      lat = (json['coordinates']['latitude'] as num?)?.toDouble();
      lng = (json['coordinates']['longitude'] as num?)?.toDouble();
    }

    return SosAlertModel(
      id: json['id']?.toString() ?? 'sos-',
      user: json['user']?.toString() ?? 'JanSuraksha User',
      phone: json['phone']?.toString() ?? '',
      type: json['type']?.toString() ?? 'Manual SOS',
      time: json['time']?.toString() ?? 'Just now',
      location: json['location']?.toString() ?? 'Live GPS Coordinates',
      latitude: lat,
      longitude: lng,
      status: json['status']?.toString() ?? 'Active',
      responders: (json['responders'] is num) ? (json['responders'] as num).toInt() : 4,
      message: json['message']?.toString(),
      triggerWord: json['triggerWord']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user': user,
      'phone': phone,
      'type': type,
      'time': time,
      'location': location,
      'coordinates': (latitude != null && longitude != null)
          ? {'latitude': latitude, 'longitude': longitude}
          : null,
      'status': status,
      'responders': responders,
      'message': message,
      'triggerWord': triggerWord,
    };
  }
}
