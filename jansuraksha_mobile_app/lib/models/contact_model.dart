class ContactModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String relation;
  final bool isPrimary;
  final String notifyLevel;
  final bool shareLocation;
  final bool verified;

  ContactModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.relation = 'Family',
    this.isPrimary = false,
    this.notifyLevel = 'always',
    this.shareLocation = true,
    this.verified = true,
  });

  factory ContactModel.fromJson(Map<String, dynamic> json) {
    return ContactModel(
      id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: json['name']?.toString() ?? 'Emergency Contact',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      relation: json['relation']?.toString() ?? 'Family',
      isPrimary: json['isPrimary'] == true,
      notifyLevel: json['notifyLevel']?.toString() ?? 'always',
      shareLocation: json['shareLocation'] != false,
      verified: json['verified'] != false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      if (email != null) 'email': email,
      'relation': relation,
      'isPrimary': isPrimary,
      'notifyLevel': notifyLevel,
      'shareLocation': shareLocation,
      'verified': verified,
    };
  }

  ContactModel copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? relation,
    bool? isPrimary,
    String? notifyLevel,
    bool? shareLocation,
    bool? verified,
  }) {
    return ContactModel(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      relation: relation ?? this.relation,
      isPrimary: isPrimary ?? this.isPrimary,
      notifyLevel: notifyLevel ?? this.notifyLevel,
      shareLocation: shareLocation ?? this.shareLocation,
      verified: verified ?? this.verified,
    );
  }
}
