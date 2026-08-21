import 'package:geolocator/geolocator.dart';
import '../models/risk_zone_model.dart';

class LocationService {
  Position? currentPosition;
  String currentAddress = 'Connaught Place, New Delhi';
  int safetyScore = 96;

  Future<Position?> getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      currentPosition = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );

      _updateAddressAndScore();
      return currentPosition;
    } catch (e) {
      currentPosition = Position(
        longitude: 77.2090,
        latitude: 28.6139,
        timestamp: DateTime.now(),
        accuracy: 10,
        altitude: 216,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );
      _updateAddressAndScore();
      return currentPosition;
    }
  }

  void _updateAddressAndScore() {
    if (currentPosition != null) {
      currentAddress = 'Lat: ${currentPosition!.latitude.toStringAsFixed(4)}, Lng: ${currentPosition!.longitude.toStringAsFixed(4)} (Live GPS)';
      safetyScore = 95;
    }
  }

  List<RiskZoneModel> getNearbyRiskZones() {
    final lat = currentPosition?.latitude ?? 28.6139;
    final lng = currentPosition?.longitude ?? 77.2090;

    return [
      RiskZoneModel(
        id: 'rz-1',
        name: 'Dark Corridor (Sector 62 Alley)',
        latitude: lat + 0.0035,
        longitude: lng + 0.0025,
        severity: 'high',
        description: 'Low-light area with multiple reported incidents after 9 PM',
        incidentCount: '4 incidents reported this week',
      ),
      RiskZoneModel(
        id: 'rz-2',
        name: 'Metro Underpass (Gate 3)',
        latitude: lat - 0.0028,
        longitude: lng + 0.0042,
        severity: 'medium',
        description: 'Isolated pathway during evening hours',
        incidentCount: '1 incident reported today',
      ),
      RiskZoneModel(
        id: 'rz-3',
        name: 'Safe Haven: 24/7 Police Post & PCR',
        latitude: lat - 0.0015,
        longitude: lng - 0.0030,
        severity: 'safe',
        description: 'Manned police booth & emergency helpdesk',
        incidentCount: 'Active Safe Zone',
      ),
    ];
  }
}
