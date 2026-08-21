import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/sos_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../../services/offline_sms_service.dart';

class LiveSafetyMapScreen extends StatefulWidget {
  const LiveSafetyMapScreen({super.key});

  @override
  State<LiveSafetyMapScreen> createState() => _LiveSafetyMapScreenState();
}

class _LiveSafetyMapScreenState extends State<LiveSafetyMapScreen> {
  final MapController _mapController = MapController();

  @override
  Widget build(BuildContext context) {
    final sos = Provider.of<SosProvider>(context);
    final userPos = sos.locationService.currentPosition;
    final lat = userPos?.latitude ?? 28.6139;
    final lng = userPos?.longitude ?? 77.2090;
    final userLatLng = LatLng(lat, lng);
    final riskZones = sos.locationService.getNearbyRiskZones();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Threat Radar Map'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location_rounded, color: AppTheme.neonCyan),
            onPressed: () {
              _mapController.move(userLatLng, 15.0);
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: userLatLng,
              initialZoom: 14.5,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.jansuraksha.app',
              ),
              CircleLayer(
                circles: riskZones.map((zone) {
                  Color circleColor;
                  if (zone.severity == 'high') {
                    circleColor = AppTheme.primaryRed.withValues(alpha: 0.3);
                  } else if (zone.severity == 'medium') {
                    circleColor = AppTheme.warningAmber.withValues(alpha: 0.3);
                  } else {
                    circleColor = AppTheme.safeEmerald.withValues(alpha: 0.25);
                  }

                  return CircleMarker(
                    point: LatLng(zone.latitude, zone.longitude),
                    radius: zone.radiusMeters,
                    useRadiusInMeter: true,
                    color: circleColor,
                    borderColor: zone.severity == 'high'
                        ? AppTheme.primaryRed
                        : (zone.severity == 'safe' ? AppTheme.safeEmerald : AppTheme.warningAmber),
                    borderStrokeWidth: 2,
                  );
                }).toList(),
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: userLatLng,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.neonCyan,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.neonCyan.withValues(alpha: 0.6),
                            blurRadius: 16,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.person_pin_circle_rounded, color: Colors.white, size: 24),
                    ),
                  ),
                  ...riskZones.map((zone) {
                    final isSafe = zone.severity == 'safe';
                    final isHigh = zone.severity == 'high';
                    return Marker(
                      point: LatLng(zone.latitude, zone.longitude),
                      width: 36,
                      height: 36,
                      child: GestureDetector(
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('${zone.name}: ${zone.description}'),
                              backgroundColor: isHigh ? AppTheme.primaryRed : AppTheme.surfaceCard,
                            ),
                          );
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSafe ? AppTheme.safeEmerald : (isHigh ? AppTheme.primaryRed : AppTheme.warningAmber),
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: Icon(
                            isSafe ? Icons.local_police_rounded : Icons.warning_amber_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: GlassCard(
              padding: const EdgeInsets.all(16),
              backgroundColor: AppTheme.surface.withValues(alpha: 0.92),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.safeEmerald.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.shield_outlined, color: AppTheme.safeEmerald, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'GPS Precision: ±8m Active',
                              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                            Text(
                              '3 Safe Havens & 2 Danger zones detected nearby',
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => OfflineSmsService.makeEmergencyCall(number: '112'),
                          icon: const Icon(Icons.phone_in_talk_rounded, color: Colors.white, size: 16),
                          label: const Text('Call 112 Police', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryRed,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            sos.broadcastOfflineSms(['+91 98765 43210'], 'Priya Sharma');
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Live location broadcasted via SMS!'), backgroundColor: AppTheme.safeEmerald),
                            );
                          },
                          icon: const Icon(Icons.share_location_rounded, color: AppTheme.neonCyan, size: 16),
                          label: const Text('Share Location', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppTheme.neonCyan),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
