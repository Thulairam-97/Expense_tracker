import 'package:drift/drift.dart';

@DataClassName('CategoryRow')
class CategoriesTable extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 64)();
  TextColumn get iconName => text().withLength(min: 1, max: 64)();
  IntColumn get colorValue => integer()();
  BoolColumn get isDefault => boolean().withDefault(const Constant(false))();
  IntColumn get displayOrder => integer().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('ExpenseRow')
class ExpensesTable extends Table {
  TextColumn get id => text()();
  RealColumn get amount => real()();
  TextColumn get merchant => text().withLength(min: 1, max: 128)();
  TextColumn get categoryId => text().references(CategoriesTable, #id)();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get paymentSource => text()();
  TextColumn get status => text().withDefault(const Constant('success'))();
  TextColumn get referenceId => text().nullable()();
  TextColumn get rawNotificationText => text().nullable()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};

  // Unique index on reference ID if present, or combination of timestamp + amount + merchant for duplicate prevention
  @override
  List<Set<Column>> get uniqueKeys => [
    {timestamp, amount, merchant, paymentSource},
  ];
}

@DataClassName('BudgetRow')
class BudgetsTable extends Table {
  TextColumn get id => text()();
  RealColumn get monthlyLimit => real()();
  IntColumn get month => integer()();
  IntColumn get year => integer()();

  @override
  Set<Column> get primaryKey => {id};

  @override
  List<Set<Column>> get uniqueKeys => [
    {month, year},
  ];
}

@DataClassName('NotificationLogRow')
class NotificationLogsTable extends Table {
  TextColumn get id => text()();
  TextColumn get packageName => text()();
  TextColumn get title => text().nullable()();
  TextColumn get body => text().nullable()();
  DateTimeColumn get receivedAt => dateTime()();
  BoolColumn get wasParsed => boolean().withDefault(const Constant(false))();
  TextColumn get detectedStatus => text().nullable()();
  RealColumn get extractedAmount => real().nullable()();
  TextColumn get extractedMerchant => text().nullable()();
  BoolColumn get isDuplicate => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}
