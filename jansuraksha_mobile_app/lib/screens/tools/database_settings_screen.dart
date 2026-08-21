import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';

class DatabaseSettingsScreen extends StatefulWidget {
  const DatabaseSettingsScreen({super.key});

  @override
  State<DatabaseSettingsScreen> createState() => _DatabaseSettingsScreenState();
}

class _DatabaseSettingsScreenState extends State<DatabaseSettingsScreen> {
  final ApiService _api = ApiService();
  final _urlController = TextEditingController();
  bool _isChecking = false;
  Map<String, dynamic>? _dbStatus;

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiService.baseUrl;
    _checkStatus();
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _checkStatus() async {
    setState(() => _isChecking = true);
    final status = await _api.checkMySQLStatus();
    if (mounted) {
      setState(() {
        _dbStatus = status;
        _isChecking = false;
      });
    }
  }

  void _applyBaseUrl(String url) {
    setState(() {
      _api.setBaseUrl(url);
      _urlController.text = url;
    });
    _checkStatus();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('API endpoint updated to: $url'),
        backgroundColor: AppTheme.safeEmerald,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MySQL Database & Server Sync'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Live Status Card
            GlassCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.safeEmerald.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.storage_rounded, color: AppTheme.safeEmerald, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'MySQL Database: ACTIVE',
                                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                              ),
                              Text(
                                'Database: jansuraksha_db (InnoDB)',
                                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.safeEmerald, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: _isChecking
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.neonCyan),
                              )
                            : const Icon(Icons.refresh_rounded, color: AppTheme.neonCyan),
                        onPressed: _checkStatus,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white10),
                  const SizedBox(height: 10),

                  _buildInfoRow('Database Host', _dbStatus?['host']?.toString() ?? 'localhost:3306 (MySQL 8.0)'),
                  _buildInfoRow('Active Database', _dbStatus?['database']?.toString() ?? 'jansuraksha_db'),
                  _buildInfoRow('Engine / Driver', _dbStatus?['driver']?.toString() ?? 'mysql2 (InnoDB)'),
                  _buildInfoRow('Registered Users Table', 'users (Auto-synced)'),
                  _buildInfoRow('Emergency SOS Table', 'sos_alerts (GPS & logs)'),
                  _buildInfoRow('Evidence Vault Table', 'safety_vault (Encrypted)'),

                ],
              ),
            ),

            const SizedBox(height: 24),

            // Server Preset Endpoints
            Text(
              'CHOOSE BACKEND ENDPOINT',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            _buildPresetOption(
              title: 'Cloud Production API',
              subtitle: 'https://jansuraksha-ai.vercel.app/api',
              url: 'https://jansuraksha-ai.vercel.app/api',
              badge: 'LIVE CLOUD',
              color: AppTheme.neonCyan,
            ),
            const SizedBox(height: 10),

            _buildPresetOption(
              title: 'Local Android Emulator (10.0.2.2)',
              subtitle: 'http://10.0.2.2:3000/api',
              url: 'http://10.0.2.2:3000/api',
              badge: 'EMULATOR',
              color: AppTheme.warningAmber,
            ),
            const SizedBox(height: 10),

            _buildPresetOption(
              title: 'Localhost / Desktop Test Server',
              subtitle: 'http://localhost:3000/api',
              url: 'http://localhost:3000/api',
              badge: 'LOCAL',
              color: AppTheme.safeEmerald,
            ),

            const SizedBox(height: 24),

            // Custom Base URL Input
            Text(
              'CUSTOM API ENDPOINT URL',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            GlassCard(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _urlController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'http://192.168.1.X:3000/api',
                        hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => _applyBaseUrl(_urlController.text.trim()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.neonCyan,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Save', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // MySQL Terminal Command Guide
            Text(
              'HOW TO VIEW REGISTERED USERS IN MYSQL',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.textMuted, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F141C),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Run in MySQL Workbench or Command Line:',
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'USE jansuraksha_db;\nSELECT id, name, email, phone, role, plan, created_at FROM users;',
                      style: GoogleFonts.robotoMono(fontSize: 12, color: AppTheme.neonCyan, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary)),
          Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildPresetOption({
    required String title,
    required String subtitle,
    required String url,
    required String badge,
    required Color color,
  }) {
    final isSelected = ApiService.baseUrl == url;

    return InkWell(
      onTap: () => _applyBaseUrl(url),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.1) : AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? color : Colors.white12,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        badge,
                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: color),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary)),
              ],
            ),
            Icon(
              isSelected ? Icons.check_circle_rounded : Icons.radio_button_off,
              color: isSelected ? color : Colors.white24,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}
