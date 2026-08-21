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
  final String membershipExpiry;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.role = 'user',
    this.plan = 'JanSuraksha Free',
    this.safetyScore = 95,
    this.avatar = 'JS',
    this.location = 'Live Radar Active',
    this.joinedDate = 'Today',
    this.membershipExpiry = 'Never',
  });

  bool get isAdmin => role.toLowerCase() == 'admin' || email.trim().toLowerCase() == 'ec23019@glbitm.ac.in';
  bool get isGold => isAdmin || plan.contains('Gold') || plan.contains('VIP') || plan.contains('Enterprise');
  bool get isPlatinum => isAdmin || plan.contains('Platinum');
  bool get isPremium => isGold || isPlatinum;


  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? role,
    String? plan,
    int? safetyScore,
    String? avatar,
    String? location,
    String? joinedDate,
    String? membershipExpiry,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      plan: plan ?? this.plan,
      safetyScore: safetyScore ?? this.safetyScore,
      avatar: avatar ?? this.avatar,
      location: location ?? this.location,
      joinedDate: joinedDate ?? this.joinedDate,
      membershipExpiry: membershipExpiry ?? this.membershipExpiry,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? 'u-anon',
      name: json['name']?.toString() ?? 'Safety User',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      plan: json['plan']?.toString() ?? 'JanSuraksha Free',
      safetyScore: (json['safetyScore'] is num) ? (json['safetyScore'] as num).toInt() : 95,
      avatar: json['avatar']?.toString() ?? (json['name'] != null && json['name'].toString().isNotEmpty ? json['name'].toString().substring(0, 1).toUpperCase() : 'JS'),
      location: json['location']?.toString() ?? 'Live Radar Active',
      joinedDate: json['joinedDate']?.toString() ?? 'Today',
      membershipExpiry: json['membershipExpiry']?.toString() ?? 'Never',
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
      'membershipExpiry': membershipExpiry,
    };
  }
}
