class UserModel {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String plan;
  final int safetyScore;
  final String avatar;
  final String location;
  final String joinedDate;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.role = 'user',
    this.plan = 'Free',
    this.safetyScore = 95,
    this.avatar = 'JS',
    this.location = 'Live Radar Active',
    this.joinedDate = 'Today',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? 'u-anon',
      name: json['name']?.toString() ?? 'Safety User',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      plan: json['plan']?.toString() ?? 'Free',
      safetyScore: (json['safetyScore'] is num) ? (json['safetyScore'] as num).toInt() : 95,
      avatar: json['avatar']?.toString() ?? (json['name'] != null && json['name'].toString().isNotEmpty ? json['name'].toString().substring(0, 1).toUpperCase() : 'JS'),
      location: json['location']?.toString() ?? 'Live Radar Active',
      joinedDate: json['joinedDate']?.toString() ?? 'Today',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'plan': plan,
      'safetyScore': safetyScore,
      'avatar': avatar,
      'location': location,
      'joinedDate': joinedDate,
    };
  }
}
