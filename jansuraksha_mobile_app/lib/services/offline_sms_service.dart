import 'package:url_launcher/url_launcher.dart';

class OfflineSmsService {
  static Future<bool> sendEmergencySms({
    required List<String> phoneNumbers,
    required double latitude,
    required double longitude,
    required String userName,
    String? customMessage,
  }) async {
    final googleMapsLink = 'https://maps.google.com/?q=$latitude,$longitude';
    final message = customMessage ??
        '?? EMERGENCY ALERT: $userName has triggered an emergency SOS from JanSuraksha AI! Current live location: $googleMapsLink. Immediate help needed!';

    final joinedPhones = phoneNumbers.join(',');
    final Uri smsUri = Uri(
      scheme: 'sms',
      path: joinedPhones,
      queryParameters: <String, String>{
        'body': message,
      },
    );

    try {
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
        return true;
      }
    } catch (_) {}
    return false;
  }

  static Future<bool> makeEmergencyCall({String number = '112'}) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: number);
    try {
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
        return true;
      }
    } catch (_) {}
    return false;
  }
}
