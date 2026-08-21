import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
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
        _apiService.setToken(_token);
      } catch (_) {}
    } else {
      // Default initial mock user for seamless instant demo
      _user = UserModel(
        id: 'u-demo-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '+91 98765 43210',
        role: 'user',
        plan: 'Premium',
        safetyScore: 98,
        avatar: 'PS',
        location: 'New Delhi, DL',
      );
      _token = 'demo-jwt-token';
      _apiService.setToken(_token);
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiService.login(email, password);
      if (res['success'] == true) {
        _token = res['token'] ?? 'jwt-login-token';
        _user = UserModel.fromJson(res['user'] ?? {'name': email.split('@')[0], 'email': email});
        _apiService.setToken(_token);

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

  Future<bool> signup(String name, String email, String phone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiService.signup(name, email, phone, password);
      if (res['success'] == true) {
        _token = res['token'] ?? 'jwt-signup-token';
        _user = UserModel.fromJson(res['user'] ?? {'name': name, 'email': email, 'phone': phone});
        _apiService.setToken(_token);

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

  Future<Map<String, dynamic>> requestOtp(String email, String name, String phone, String password) async {
    _isLoading = true;
    notifyListeners();
    final res = await _apiService.requestEmailOtp(email, name, phone, password);
    _isLoading = false;
    notifyListeners();
    return res;
  }

  Future<bool> verifyOtp(String email, String otp) async {
    _isLoading = true;
    notifyListeners();
    final res = await _apiService.verifyEmailOtp(email, otp);

    if (res['success'] == true) {
      _token = res['token'] ?? 'jwt-otp-token';
      _user = UserModel.fromJson(res['user'] ?? {'name': 'Verified User', 'email': email});
      _apiService.setToken(_token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_user', jsonEncode(_user!.toJson()));

      _isLoading = false;
      notifyListeners();
      return true;
    }

    _errorMessage = res['message'] ?? 'Invalid OTP code';
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
