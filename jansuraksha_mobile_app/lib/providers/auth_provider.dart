import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService apiService = ApiService();
  
  UserModel? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _loadUserFromStorage();
  }

  Future<void> _loadUserFromStorage() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    final userJson = prefs.getString('auth_user');

    if (_token != null && userJson != null) {
      try {
        _user = UserModel.fromJson(jsonDecode(userJson));
        apiService.setToken(_token);
      } catch (_) {}
    } else {
      // Default Enterprise Safety User
      _user = UserModel(
        id: 'u-live-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43210',
        role: 'user',
        plan: 'Enterprise Shield',
        safetyScore: 98,
        avatar: 'PS',
        location: 'Live GPS Radar Active',
      );
      _token = 'jwt-live-token';
      apiService.setToken(_token);
    }
    notifyListeners();
  }

  // Direct Password Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiService.login(email, password);
      if (res['success'] == true) {
        _token = res['token'] ?? 'jwt-token-${DateTime.now().millisecondsSinceEpoch}';
        _user = UserModel.fromJson(res['user'] ?? {'name': email.split('@')[0], 'email': email, 'phone': '+91 98765 43210'});
        apiService.setToken(_token);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_user', jsonEncode(_user!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res['message'] ?? 'Login failed';
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Request Email OTP for Login
  Future<Map<String, dynamic>> loginRequestOtp(String email) async {
    _isLoading = true;
    notifyListeners();
    final res = await apiService.loginInitiate(email);
    _isLoading = false;
    notifyListeners();
    return res;
  }

  // Verify Email OTP for Login
  Future<bool> loginVerifyOtp(String email, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await apiService.loginVerify(email, otp);
    if (res['success'] == true) {
      _token = res['token'] ?? 'jwt-token-${DateTime.now().millisecondsSinceEpoch}';
      _user = UserModel.fromJson(res['user'] ?? {'name': email.split('@')[0], 'email': email});
      apiService.setToken(_token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_user', jsonEncode(_user!.toJson()));

      _isLoading = false;
      notifyListeners();
      return true;
    }

    _errorMessage = res['message'] ?? 'Invalid verification code';
    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Direct Sign Up
  Future<bool> signup(String name, String email, String phone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await apiService.signup(name, email, phone, password);
      if (res['success'] == true) {
        _token = res['token'] ?? 'jwt-signup-${DateTime.now().millisecondsSinceEpoch}';
        _user = UserModel.fromJson(res['user'] ?? {'name': name, 'email': email, 'phone': phone});
        apiService.setToken(_token);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_user', jsonEncode(_user!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res['message'] ?? 'Signup failed';
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Request Email OTP for Sign Up
  Future<Map<String, dynamic>> requestOtp(String email, String name, String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    final res = await apiService.requestEmailOtp(email, name, phone, password);
    _isLoading = false;
    notifyListeners();
    return res;
  }

  // Verify Email OTP for Sign Up
  Future<bool> verifyOtp(String email, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await apiService.verifyEmailOtp(email, otp);
    if (res['success'] == true) {
      _token = res['token'] ?? 'jwt-verified-${DateTime.now().millisecondsSinceEpoch}';
      _user = UserModel.fromJson(res['user'] ?? {'name': 'Verified User', 'email': email});
      apiService.setToken(_token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_user', jsonEncode(_user!.toJson()));

      _isLoading = false;
      notifyListeners();
      return true;
    }

    _errorMessage = res['message'] ?? 'Invalid verification code';
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_user');
    notifyListeners();
  }
}
