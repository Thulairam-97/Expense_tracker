import 'dart:convert';
import 'package:flutter/services.dart';
import '../../domain/models/expense.dart';

class LocalExpenseStorage {
  static const MethodChannel _platform =
      MethodChannel('com.personal.upiexpensetracker/notification_control');
  static const String _keyExpenses = 'persisted_user_expenses_v1';
  static const String _keyUserPin = 'persisted_user_pin_v1';
  static const String _keyUserName = 'persisted_user_name_v1';

  /// Save expenses list as JSON in Android SharedPreferences through native channel
  static Future<void> saveExpenses(List<Expense> expenses) async {
    try {
      final List<Map<String, dynamic>> mapList =
          expenses.map((e) => e.toMap()).toList();
      final jsonString = jsonEncode(mapList);
      await _platform.invokeMethod('saveLocalData', {
        'key': _keyExpenses,
        'value': jsonString,
      });
    } catch (e) {
      // Non-fatal, fallback to memory
    }
  }

  /// Load persisted expenses
  static Future<List<Expense>?> loadExpenses() async {
    try {
      final String? jsonString = await _platform.invokeMethod<String>('getLocalData', {
        'key': _keyExpenses,
      });
      if (jsonString == null || jsonString.isEmpty) {
        return null;
      }
      final dynamic decoded = jsonDecode(jsonString);
      if (decoded is List) {
        return decoded
            .map((item) => Expense.fromMap(Map<String, dynamic>.from(item as Map)))
            .toList();
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /// Clear all persisted expenses
  static Future<void> clearExpenses() async {
    try {
      await _platform.invokeMethod('saveLocalData', {
        'key': _keyExpenses,
        'value': '[]',
      });
    } catch (_) {}
  }

  /// Check if user has set up a quick passcode/PIN
  static Future<String?> getSavedPin() async {
    try {
      return await _platform.invokeMethod<String>('getLocalData', {
        'key': _keyUserPin,
      });
    } catch (_) {
      return null;
    }
  }

  /// Save user quick PIN / passcode
  static Future<void> savePin(String pin) async {
    try {
      await _platform.invokeMethod('saveLocalData', {
        'key': _keyUserPin,
        'value': pin,
      });
    } catch (_) {}
  }

  /// Get user display profile name
  static Future<String?> getUserName() async {
    try {
      return await _platform.invokeMethod<String>('getLocalData', {
        'key': _keyUserName,
      });
    } catch (_) {
      return null;
    }
  }

  /// Save user profile name
  static Future<void> saveUserName(String name) async {
    try {
      await _platform.invokeMethod('saveLocalData', {
        'key': _keyUserName,
        'value': name,
      });
    } catch (_) {}
  }
}
