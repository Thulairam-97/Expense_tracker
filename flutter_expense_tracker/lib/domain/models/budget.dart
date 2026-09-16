import 'package:equatable/equatable.dart';

class Budget extends Equatable {
  final String id;
  final double monthlyLimit;
  final int month; // 1 - 12
  final int year;
  final Map<String, double> categoryLimits; // categoryId -> limit

  const Budget({
    required this.id,
    required this.monthlyLimit,
    required this.month,
    required this.year,
    this.categoryLimits = const {},
  });

  Budget copyWith({
    String? id,
    double? monthlyLimit,
    int? month,
    int? year,
    Map<String, double>? categoryLimits,
  }) {
    return Budget(
      id: id ?? this.id,
      monthlyLimit: monthlyLimit ?? this.monthlyLimit,
      month: month ?? this.month,
      year: year ?? this.year,
      categoryLimits: categoryLimits ?? this.categoryLimits,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'monthlyLimit': monthlyLimit,
      'month': month,
      'year': year,
    };
  }

  @override
  List<Object?> get props => [id, monthlyLimit, month, year, categoryLimits];
}
