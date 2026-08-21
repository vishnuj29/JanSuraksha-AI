import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';


class PremiumMembershipScreen extends StatefulWidget {
  const PremiumMembershipScreen({super.key});

  @override
  State<PremiumMembershipScreen> createState() => _PremiumMembershipScreenState();
}

class _PremiumMembershipScreenState extends State<PremiumMembershipScreen> {
  int _selectedPlanIndex = 1; // 0: Monthly, 1: Annual Gold (Best Value), 2: Platinum VIP
  final TextEditingController _couponController = TextEditingController();
  bool _couponApplied = false;
  double _discountPercent = 0.0;
  String _selectedPaymentMethod = 'UPI (Google Pay / PhonePe / Paytm)';

  final List<Map<String, dynamic>> _plans = [
    {
      'id': 'gold_monthly',
      'name': 'JanSuraksha Gold',
      'duration': 'Monthly',
      'price': 149,
      'originalPrice': 299,
      'tag': 'FLEXIBLE',
      'isGold': true,
      'desc': 'Billed monthly. Cancel anytime.',
    },
    {
      'id': 'gold_annual',
      'name': 'JanSuraksha Gold VIP',
      'duration': 'Annual (Save 50%)',
      'price': 899,
      'originalPrice': 1799,
      'tag': 'BEST VALUE',
      'isGold': true,
      'isPopular': true,
      'desc': '₹74/mo • Full 24/7 AI protection for 1 year.',
    },
    {
      'id': 'platinum_family',
      'name': 'Platinum Family VIP',
      'duration': 'Annual (6 Members)',
      'price': 1499,
      'originalPrice': 2999,
      'tag': 'FAMILY CIRCLE',
      'isGold': false,
      'desc': 'Covers you + 5 family members with 24/7 live concierge.',
    },
  ];

  final List<Map<String, dynamic>> _benefits = [
    {
      'title': 'Priority 112 & Police Emergency Routing',
      'desc': 'Tier-1 expedited routing directly connecting with local police dispatch and nearby patrol units.',
    },
    {
      'title': '24/7 Background AI Voice Sentinel',
      'desc': 'Continuous hands-free distress recognition even when phone is locked or placed in pocket.',
    },
    {
      'title': 'Unlimited Emergency Guardian Circle',
      'desc': 'Instant multi-channel SMS and rich email broadcast with live GPS breadcrumbs to unlimited contacts.',
    },
    {
      'title': 'Automated Encrypted Cloud Evidence Vault',
      'desc': 'Military-grade 256-bit encrypted audio, front-camera photo snapshots, and video evidence backup.',
    },
    {
      'title': '₹5,00,000 Safety Cover & Insurance',
      'desc': 'Complimentary personal accident and emergency assistance cover included for all active members.',
    },
    {
      'title': 'AI Fake Caller Pro',
      'desc': 'Simulate realistic phone calls with customizable voices and dialogues to gracefully leave unsafe situations.',
    },
  ];

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  void _applyCoupon() {
    final code = _couponController.text.trim().toUpperCase();
    if (code == 'SAFETY50' || code == 'ZOMATO50' || code == 'GOLD2026' || code == 'PROTECT') {
      setState(() {
        _couponApplied = true;
        _discountPercent = 0.50;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Promo "$code" applied! 50% discount unlocked.'),
          backgroundColor: AppTheme.goldDark,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid promo code. Try "SAFETY50"'),
          backgroundColor: AppTheme.primaryRed,
        ),
      );
    }
  }

  void _showCheckoutDialog(BuildContext context, Map<String, dynamic> selectedPlan) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final rawPrice = selectedPlan['price'] as int;
    final finalPrice = _couponApplied ? (rawPrice * (1.0 - _discountPercent)).toInt() : rawPrice;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Color(0xFF121620),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                border: Border(top: BorderSide(color: Color(0xFFD4AF37), width: 1.5)),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              selectedPlan['name'],
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              selectedPlan['duration'],
                              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                        Text(
                          '₹$finalPrice',
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFFFFD700),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    const Divider(color: Colors.white10),
                    const SizedBox(height: 12),

                    Text(
                      'PAYMENT METHOD',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textMuted,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const SizedBox(height: 10),

                    ...[
                      'UPI (Google Pay / PhonePe / Paytm)',
                      'Credit / Debit Card (Visa, Mastercard, RuPay)',
                      'Net Banking (All Indian Banks)',
                    ].map((method) {
                      final isSel = _selectedPaymentMethod == method;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: InkWell(
                          onTap: () {
                            setModalState(() => _selectedPaymentMethod = method);
                            setState(() => _selectedPaymentMethod = method);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFF201B12) : const Color(0xFF0F131C),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSel ? const Color(0xFFD4AF37) : Colors.white12,
                                width: isSel ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isSel ? Icons.radio_button_checked : Icons.radio_button_off,
                                  color: isSel ? const Color(0xFFFFD700) : AppTheme.textMuted,
                                  size: 18,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    method,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                                      color: isSel ? Colors.white : AppTheme.textSecondary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.of(ctx).pop();
                          await auth.upgradeMembership(
                            selectedPlan['name'],
                            expiry: 'Active until ${DateTime.now().year + 1}',
                          );

                          if (!context.mounted) return;

                          showDialog(
                            context: context,
                            builder: (c) => AlertDialog(
                              backgroundColor: const Color(0xFF121620),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
                              ),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: AppTheme.goldGradient,
                                    ),
                                    child: const Icon(Icons.workspace_premium_rounded, color: Colors.black, size: 40),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'MEMBERSHIP ACTIVATED',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      color: const Color(0xFFFFD700),
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Welcome to ${selectedPlan['name']}. 24/7 AI protection & Priority Police Routing are now active.',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textSecondary),
                                  ),
                                  const SizedBox(height: 20),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        Navigator.of(c).pop();
                                        Navigator.of(context).pop();
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFFFD700),
                                        foregroundColor: Colors.black,
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w800)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFFD700),
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text(
                          'COMPLETE PAYMENT • ₹$finalPrice',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 0.8),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final isAlreadyGold = user?.isGold ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(
          'JanSuraksha Membership',
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            // Elegant Metallic Gold & Onyx VIP Membership Card
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E1A14), Color(0xFF12100C), Color(0xFF0A0907)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFD4AF37).withValues(alpha: 0.4), width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.shield_rounded, color: Color(0xFFFFD700), size: 22),
                          const SizedBox(width: 8),
                          Text(
                            'JANSURAKSHA GOLD',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFFFFD700),
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD4AF37).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFD4AF37)),
                        ),
                        child: Text(
                          isAlreadyGold ? 'ACTIVE' : 'PREMIUM',
                          style: const TextStyle(color: Color(0xFFFFD700), fontSize: 10, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  Text(
                    user?.name ?? 'Priya Sharma',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ID: JS-${user?.id ?? "VIP8892"}',
                        style: GoogleFonts.robotoMono(fontSize: 11, color: Colors.white54),
                      ),
                      Text(
                        isAlreadyGold ? user?.membershipExpiry ?? 'Active' : 'Priority 112 Dispatch',
                        style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFFFD700)),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Plan Selectors
            Text(
              'MEMBERSHIP PLANS',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 10),

            ..._plans.asMap().entries.map((entry) {
              final idx = entry.key;
              final plan = entry.value;
              final isSelected = _selectedPlanIndex == idx;
              final rawPrice = plan['price'] as int;
              final finalPrice = _couponApplied ? (rawPrice * (1.0 - _discountPercent)).toInt() : rawPrice;

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  onTap: () => setState(() => _selectedPlanIndex = idx),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF1B1710) : const Color(0xFF10131A),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFFD4AF37) : Colors.white12,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                              color: isSelected ? const Color(0xFFFFD700) : Colors.white24,
                              size: 18,
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      plan['name'],
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    if (plan['isPopular'] == true) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'SAVE 50%',
                                          style: GoogleFonts.inter(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w900,
                                            color: const Color(0xFFFFD700),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  plan['desc'],
                                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '₹$finalPrice',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: isSelected ? const Color(0xFFFFD700) : Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            const SizedBox(height: 14),

            // Clean Minimalist Promo Code Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF10131A),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_offer_outlined, color: Color(0xFFFFD700), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _couponController,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(
                        hintText: 'Promo Code (e.g. SAFETY50)',
                        hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                        isDense: true,
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _applyCoupon,
                    child: Text(
                      _couponApplied ? 'APPLIED' : 'APPLY',
                      style: const TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.w800, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Benefits List
            Text(
              'INCLUDED WITH MEMBERSHIP',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 10),

            ..._benefits.map((b) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(Icons.check_circle_outline_rounded, color: Color(0xFFFFD700), size: 16),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            b['title'],
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            b['desc'],
                            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textSecondary, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 24),

            // Clean Gold CTA
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () => _showCheckoutDialog(context, _plans[_selectedPlanIndex]),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFD700),
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  'UPGRADE TO ${_plans[_selectedPlanIndex]['name'].toUpperCase()}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
