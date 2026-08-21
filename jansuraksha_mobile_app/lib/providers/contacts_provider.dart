import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/contact_model.dart';

class ContactsProvider with ChangeNotifier {
  List<ContactModel> _contacts = [];
  bool _isLoading = false;

  List<ContactModel> get contacts => _contacts;
  bool get isLoading => _isLoading;

  ContactsProvider() {
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('user_contacts');

    if (cached != null) {
      try {
        final List list = jsonDecode(cached);
        _contacts = list.map((c) => ContactModel.fromJson(c)).toList();
      } catch (_) {}
    } else {
      _contacts = [
        ContactModel(
          id: 'c1',
          name: 'Mom (Family Circle)',
          phone: '+91 98765 43210',
          relation: 'Family',
          isPrimary: true,
          notifyLevel: 'always',
        ),
        ContactModel(
          id: 'c2',
          name: 'Pooja (Best Friend)',
          phone: '+91 98111 22334',
          relation: 'Friend',
          isPrimary: true,
          notifyLevel: 'always',
        ),
        ContactModel(
          id: 'c3',
          name: 'National Emergency Response (112)',
          phone: '112',
          relation: 'Other',
          isPrimary: true,
          notifyLevel: 'always',
        ),
      ];
      _saveToPrefs();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addContact(ContactModel contact) async {
    _contacts.add(contact);
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> updateContact(ContactModel updated) async {
    final index = _contacts.indexWhere((c) => c.id == updated.id);
    if (index != -1) {
      _contacts[index] = updated;
      _saveToPrefs();
      notifyListeners();
    }
  }

  Future<void> removeContact(String id) async {
    _contacts.removeWhere((c) => c.id == id);
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> _saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(_contacts.map((c) => c.toJson()).toList());
    await prefs.setString('user_contacts', encoded);
  }

  List<String> get primaryPhoneNumbers {
    return _contacts.map((c) => c.phone).where((p) => p.isNotEmpty).toList();
  }
}
