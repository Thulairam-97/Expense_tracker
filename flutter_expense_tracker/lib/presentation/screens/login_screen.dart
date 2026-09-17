import 'package:flutter/material.dart';
import '../../core/services/local_expense_storage.dart';
import '../widgets/app_logo.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onAuthenticated;

  const LoginScreen({super.key, required this.onAuthenticated});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  String _enteredPin = '';
  String? _savedPin;
  String? _savedName;
  bool _isLoading = true;
  bool _isSettingNewPin = false;
  bool _isSuccessLoading = false;
  String? _errorMessage;
  final TextEditingController _nameController = TextEditingController();

  late AnimationController _shakeController;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _checkInitialState();
  }

  @override
  void dispose() {
    _shakeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _checkInitialState() async {
    final pin = await LocalExpenseStorage.getSavedPin();
    final name = await LocalExpenseStorage.getUserName();
    setState(() {
      _savedPin = pin;
      _savedName = name;
      _isSettingNewPin = pin == null || pin.isEmpty;
      _isLoading = false;
    });
  }

  void _onDigitPressed(String digit) {
    if (_enteredPin.length >= 4) return;

    setState(() {
      _enteredPin += digit;
      _errorMessage = null;
    });

    if (_enteredPin.length == 4) {
      _verifyOrSavePin();
    }
  }

  void _onBackspace() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _errorMessage = null;
      });
    }
  }

  Future<void> _verifyOrSavePin() async {
    if (_isSettingNewPin) {
      final name = _nameController.text.trim();
      await LocalExpenseStorage.savePin(_enteredPin);
      if (name.isNotEmpty) {
        await LocalExpenseStorage.saveUserName(name);
      }
      _triggerSuccessTransition();
    } else {
      if (_enteredPin == _savedPin) {
        _triggerSuccessTransition();
      } else {
        _shakeController.forward(from: 0.0);
        setState(() {
          _errorMessage = 'Incorrect PIN. Try again';
          _enteredPin = '';
        });
      }
    }
  }

  void _triggerSuccessTransition() {
    setState(() {
      _isSuccessLoading = true;
    });

    // Elegant loading delay to showcase the loading logo & decrypting animation
    Future.delayed(const Duration(milliseconds: 950), () {
      if (mounted) {
        widget.onAuthenticated();
      }
    });
  }

  void _simulateBiometricUnlock() {
    // Zero-friction biometric instant unlock
    _triggerSuccessTransition();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAF9),
        body: Center(
          child: LoadingLogo(
            size: 80,
            statusMessage: 'Initializing secure vault...',
          ),
        ),
      );
    }

    if (_isSuccessLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8FAF9),
        body: Center(
          child: LoadingLogo(
            size: 90,
            statusMessage: 'Decrypting offline expenses & trends...',
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF9),
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(flex: 1),

            // App Logo
            const AppLogo(size: 72, showGlow: true),
            const SizedBox(height: 18),

            // Title
            Text(
              _isSettingNewPin
                  ? 'Set 4-Digit Security PIN'
                  : 'Welcome Back${_savedName != null && _savedName!.isNotEmpty ? ", $_savedName" : ""}',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF191C1B),
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _isSettingNewPin
                  ? 'Create a PIN to protect your personal expense ledger'
                  : 'Enter your 4-digit PIN to access your real-time expenses',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
              ),
              textAlign: TextAlign.center,
            ),

            if (_isSettingNewPin) ...[
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: TextField(
                  controller: _nameController,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    hintText: 'Your name (optional)',
                    hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 28),

            // 4 PIN Dots with shake animation
            AnimatedBuilder(
              animation: _shakeController,
              builder: (context, child) {
                final double offset = 12 * (1 - _shakeController.value) *
                    ((_shakeController.value * 6).toInt() % 2 == 0 ? 1 : -1);
                return Transform.translate(
                  offset: Offset(offset, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(4, (index) {
                      final isFilled = index < _enteredPin.length;
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 10),
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isFilled
                              ? const Color(0xFF0F766E)
                              : Colors.transparent,
                          border: Border.all(
                            color: isFilled
                                ? const Color(0xFF0F766E)
                                : const Color(0xFF94A3B8),
                            width: 2,
                          ),
                        ),
                      );
                    }),
                  ),
                );
              },
            ),

            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                style: const TextStyle(
                  color: Colors.redAccent,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],

            const Spacer(flex: 1),

            // Custom Number Keypad
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 36),
              child: Column(
                children: [
                  _buildKeypadRow(['1', '2', '3']),
                  const SizedBox(height: 14),
                  _buildKeypadRow(['4', '5', '6']),
                  const SizedBox(height: 14),
                  _buildKeypadRow(['7', '8', '9']),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Biometric / FaceID button
                      InkWell(
                        onTap: _simulateBiometricUnlock,
                        borderRadius: BorderRadius.circular(36),
                        child: Container(
                          width: 68,
                          height: 68,
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.fingerprint_rounded,
                            size: 32,
                            color: Color(0xFF0F766E),
                          ),
                        ),
                      ),
                      _buildKeypadButton('0'),
                      // Backspace button
                      InkWell(
                        onTap: _onBackspace,
                        borderRadius: BorderRadius.circular(36),
                        child: Container(
                          width: 68,
                          height: 68,
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.backspace_outlined,
                            size: 24,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            // Skip / Quick Access option
            TextButton(
              onPressed: widget.onAuthenticated,
              child: const Text(
                'Skip to Dashboard',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildKeypadRow(List<String> digits) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: digits.map((digit) => _buildKeypadButton(digit)).toList(),
    );
  }

  Widget _buildKeypadButton(String digit) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(36),
      elevation: 0.5,
      child: InkWell(
        onTap: () => _onDigitPressed(digit),
        borderRadius: BorderRadius.circular(36),
        splashColor: const Color(0xFFCCFBF1),
        child: Container(
          width: 68,
          height: 68,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Text(
            digit,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
        ),
      ),
    );
  }
}
