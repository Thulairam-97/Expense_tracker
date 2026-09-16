import 'package:flutter/material.dart';

class ExpenseCategory {
  final String id;
  final String name;
  final String iconName;
  final int colorValue;
  final bool isDefault;
  final int displayOrder;

  const ExpenseCategory({
    required this.id,
    required this.name,
    required this.iconName,
    required this.colorValue,
    this.isDefault = false,
    this.displayOrder = 0,
  });

  ExpenseCategory copyWith({
    String? id,
    String? name,
    String? iconName,
    int? colorValue,
    bool? isDefault,
    int? displayOrder,
  }) {
    return ExpenseCategory(
      id: id ?? this.id,
      name: name ?? this.name,
      iconName: iconName ?? this.iconName,
      colorValue: colorValue ?? this.colorValue,
      isDefault: isDefault ?? this.isDefault,
      displayOrder: displayOrder ?? this.displayOrder,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'iconName': iconName,
      'colorValue': colorValue,
      'isDefault': isDefault ? 1 : 0,
      'displayOrder': displayOrder,
    };
  }

  factory ExpenseCategory.fromMap(Map<String, dynamic> map) {
    return ExpenseCategory(
      id: map['id'] as String,
      name: map['name'] as String,
      iconName: map['iconName'] as String,
      colorValue: map['colorValue'] as int,
      isDefault: (map['isDefault'] as int) == 1,
      displayOrder: map['displayOrder'] as int,
    );
  }

  static List<ExpenseCategory> get defaultCategories => const [
    ExpenseCategory(
      id: 'cat_food',
      name: 'Food',
      iconName: 'restaurant',
      colorValue: 0xFFFF5722, // Deep Orange
      isDefault: true,
      displayOrder: 1,
    ),
    ExpenseCategory(
      id: 'cat_groceries',
      name: 'Groceries',
      iconName: 'shopping_basket',
      colorValue: 0xFF4CAF50, // Green
      isDefault: true,
      displayOrder: 2,
    ),
    ExpenseCategory(
      id: 'cat_fuel',
      name: 'Fuel',
      iconName: 'local_gas_station',
      colorValue: 0xFFFF9800, // Amber
      isDefault: true,
      displayOrder: 3,
    ),
    ExpenseCategory(
      id: 'cat_recharge',
      name: 'Recharge',
      iconName: 'phone_android',
      colorValue: 0xFF00BCD4, // Cyan
      isDefault: true,
      displayOrder: 4,
    ),
    ExpenseCategory(
      id: 'cat_bills',
      name: 'Bills',
      iconName: 'receipt_long',
      colorValue: 0xFF9C27B0, // Purple
      isDefault: true,
      displayOrder: 5,
    ),
    ExpenseCategory(
      id: 'cat_shopping',
      name: 'Shopping',
      iconName: 'shopping_bag',
      colorValue: 0xFFE91E63, // Pink
      isDefault: true,
      displayOrder: 6,
    ),
    ExpenseCategory(
      id: 'cat_transport',
      name: 'Transport',
      iconName: 'directions_bus',
      colorValue: 0xFF2196F3, // Blue
      isDefault: true,
      displayOrder: 7,
    ),
    ExpenseCategory(
      id: 'cat_entertainment',
      name: 'Entertainment',
      iconName: 'movie',
      colorValue: 0xFF673AB7, // Deep Purple
      isDefault: true,
      displayOrder: 8,
    ),
    ExpenseCategory(
      id: 'cat_medical',
      name: 'Medical',
      iconName: 'local_hospital',
      colorValue: 0xFFF44336, // Red
      isDefault: true,
      displayOrder: 9,
    ),
    ExpenseCategory(
      id: 'cat_education',
      name: 'Education',
      iconName: 'school',
      colorValue: 0xFF3F51B5, // Indigo
      isDefault: true,
      displayOrder: 10,
    ),
    ExpenseCategory(
      id: 'cat_emi',
      name: 'EMI / Loan',
      iconName: 'account_balance',
      colorValue: 0xFF607D8B, // Blue Grey
      isDefault: true,
      displayOrder: 11,
    ),
    ExpenseCategory(
      id: 'cat_travel',
      name: 'Travel',
      iconName: 'flight_takeoff',
      colorValue: 0xFF009688, // Teal
      isDefault: true,
      displayOrder: 12,
    ),
    ExpenseCategory(
      id: 'cat_subscriptions',
      name: 'Subscriptions',
      iconName: 'subscriptions',
      colorValue: 0xFFFFC107, // Amber Accent
      isDefault: true,
      displayOrder: 13,
    ),
    ExpenseCategory(
      id: 'cat_other',
      name: 'Other',
      iconName: 'more_horiz',
      colorValue: 0xFF757575, // Grey
      isDefault: true,
      displayOrder: 14,
    ),
  ];
}
