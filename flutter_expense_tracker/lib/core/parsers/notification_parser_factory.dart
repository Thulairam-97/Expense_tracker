import '../../domain/models/parsed_transaction.dart';
import 'base_notification_parser.dart';
import 'gpay_notification_parser.dart';
import 'phonepe_notification_parser.dart';
import 'paytm_notification_parser.dart';
import 'generic_upi_notification_parser.dart';

class NotificationParserFactory {
  final List<BaseNotificationParser> _parsers;

  NotificationParserFactory({List<BaseNotificationParser>? customParsers})
      : _parsers = customParsers ??
            [
              GPayNotificationParser(),
              PhonePeNotificationParser(),
              PaytmNotificationParser(),
              GenericUPINotificationParser(),
            ];

  /// Register a new parser at runtime (e.g. for a new banking app or regional payment gateway)
  void registerParser(BaseNotificationParser parser, {bool highPriority = true}) {
    if (highPriority) {
      _parsers.insert(0, parser);
    } else {
      _parsers.add(parser);
    }
  }

  /// Parse an incoming notification payload using the best-matching parser
  ParsedTransaction? parseNotification({
    required String packageName,
    required String title,
    required String body,
    required DateTime timestamp,
  }) {
    for (final parser in _parsers) {
      if (parser.canHandle(packageName, title, body)) {
        final result = parser.parse(
          packageName: packageName,
          title: title,
          body: body,
          timestamp: timestamp,
        );
        if (result != null) {
          return result;
        }
      }
    }
    return null;
  }
}
