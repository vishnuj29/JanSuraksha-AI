import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../../services/offline_sms_service.dart';

class NearbySafeHavensScreen extends StatefulWidget {
  const NearbySafeHavensScreen({super.key});

  @override
  State<NearbySafeHavensScreen> createState() => _NearbySafeHavensScreenState();
}

class _NearbySafeHavensScreenState extends State<NearbySafeHavensScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Police Stations',
    'Hospitals 24/7',
    'Women Help Desks',
    'Metro Stations',
    'Petrol Pumps',
  ];

  final List<Map<String, dynamic>> _places = [
    {
      'id': 'p1',
      'category': 'Police Stations',
      'name': 'Central Police Station (Connaught Place)',
      'address': 'Parliament Street, New Delhi',
      'distance': '0.4 km',
      'walkingTime': '3 min walk',
      'phone': '011-23361100',
      'rating': 4.9,
      'reviews': 840,
      'is24x7': true,
      'isCctv': true,
      'badge': 'POLICE HEADQUARTERS',
      'badgeColor': AppTheme.primaryRed,
      'icon': Icons.local_police_rounded,
    },
    {
      'id': 'p2',
      'category': 'Women Help Desks',
      'name': 'Pink Police Help Booth & Women Sentinel',
      'address': 'Gate No. 2, Rajiv Chowk Metro',
      'distance': '0.6 km',
      'walkingTime': '5 min walk',
      'phone': '1091',
      'rating': 5.0,
      'reviews': 1200,
      'is24x7': true,
      'isCctv': true,
      'badge': 'WOMEN SAFE HAVEN',
      'badgeColor': AppTheme.neonPink,
      'icon': Icons.security_rounded,
    },
    {
      'id': 'p3',
      'category': 'Hospitals 24/7',
      'name': 'Dr. RML Emergency Hospital & Trauma Care',
      'address': 'Baba Kharak Singh Marg, New Delhi',
      'distance': '1.1 km',
      'walkingTime': '8 min drive',
      'phone': '011-23365525',
      'rating': 4.8,
      'reviews': 2300,
      'is24x7': true,
      'isCctv': true,
      'badge': 'TRAUMA CENTER',
      'badgeColor': AppTheme.safeEmerald,
      'icon': Icons.local_hospital_rounded,
    },
    {
      'id': 'p4',
      'category': 'Metro Stations',
      'name': 'Rajiv Chowk Metro (Security Desk Gate 4)',
      'address': 'Connaught Circus, D Block',
      'distance': '0.3 km',
      'walkingTime': '2 min walk',
      'phone': '011-23417910',
      'rating': 4.7,
      'reviews': 3100,
      'is24x7': false,
      'isCctv': true,
      'badge': 'CISF PROTECTED',
      'badgeColor': AppTheme.neonCyan,
      'icon': Icons.train_rounded,
    },
    {
      'id': 'p5',
      'category': 'Petrol Pumps',
      'name': 'Indian Oil 24x7 Auto Care & Lit Rest Area',
      'address': 'Barakhamba Road Corner',
      'distance': '0.8 km',
      'walkingTime': '6 min walk',
      'phone': '1800-2333-555',
      'rating': 4.6,
      'reviews': 490,
      'is24x7': true,
      'isCctv': true,
      'badge': 'BRIGHT LIT ZONE',
      'badgeColor': AppTheme.warningAmber,
      'icon': Icons.local_gas_station_rounded,
    },
  ];

  Future<void> _openDirections(String placeName) async {
    final query = Uri.encodeComponent(placeName);
    final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    try {
      if (await canLaunchUrl(url)) {
        await launchUrl(url);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final filteredPlaces = _selectedCategory == 'All'
        ? _places
        : _places.where((p) => p['category'] == _selectedCategory).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Safe Havens & Police'),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category Filter Pills (Swiggy / Zomato style)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: _categories.map((cat) {
                  final isSel = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSel,
                      selectedColor: AppTheme.primaryRed,
                      backgroundColor: AppTheme.surfaceCard,
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : AppTheme.textSecondary,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        fontSize: 12,
                      ),
                      onSelected: (_) => setState(() => _selectedCategory = cat),
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: 8),

            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: filteredPlaces.length,
                itemBuilder: (ctx, i) {
                  final place = filteredPlaces[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: (place['badgeColor'] as Color).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: place['badgeColor'] as Color),
                                ),
                                child: Text(
                                  place['badge'],
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: place['badgeColor'] as Color,
                                  ),
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: AppTheme.goldPrimary, size: 16),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${place['rating']} (${place['reviews']})',
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                                  ),
                                ],
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceLight,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Icon(place['icon'] as IconData, color: place['badgeColor'] as Color, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      place['name'],
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      place['address'],
                                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Icon(Icons.directions_walk_rounded, size: 14, color: AppTheme.safeEmerald),
                                        const SizedBox(width: 3),
                                        Text(
                                          '${place['distance']} • ${place['walkingTime']}',
                                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.safeEmerald, fontWeight: FontWeight.w700),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 14),
                          const Divider(color: Colors.white10),
                          const SizedBox(height: 10),

                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => OfflineSmsService.makeEmergencyCall(number: place['phone']),
                                  icon: const Icon(Icons.call_rounded, size: 16, color: AppTheme.safeEmerald),
                                  label: const Text('Call Desk', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: AppTheme.safeEmerald),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _openDirections(place['name']),
                                  icon: const Icon(Icons.navigation_rounded, size: 16, color: Colors.white),
                                  label: const Text('Directions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.surfaceLight,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
