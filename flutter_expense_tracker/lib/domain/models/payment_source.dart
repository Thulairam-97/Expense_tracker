/// Represents the origin application or payment instrument
enum PaymentSource {
  gpay('Google Pay', 'com.google.android.apps.nbu.paisa.user'),
  phonepe('PhonePe', 'com.phonepe.app'),
  paytm('Paytm', 'net.one97.paytm'),
  bhim('BHIM UPI', 'in.org.npci.upiapp'),
  cred('CRED', 'com.dreamplug.androidapp'),
  amazonPay('Amazon Pay', 'in.amazon.mShop.android.shopping'),
  bank('Net Banking / Bank App', 'bank.generic'),
  manual('Manual Entry', 'manual.entry'),
  other('Other UPI App', 'other.upi');

  final String displayName;
  final String packageIdentifier;

  const PaymentSource(this.displayName, this.packageIdentifier);

  static PaymentSource fromPackageName(String packageName) {
    for (final source in PaymentSource.values) {
      if (source.packageIdentifier == packageName) {
        return source;
      }
    }
    return PaymentSource.other;
  }
}
