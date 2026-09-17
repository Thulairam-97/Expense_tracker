import 'package:flutter/material.dart';
import '../../core/services/local_expense_storage.dart';

class SettingsScreen extends StatefulWidget {
  final bool isPermissionGranted;
  final VoidCallback onOpenSettings;
  final VoidCallback onClearAllData;
  final VoidCallback onLockApp;

  const SettingsScreen({
    super.key,
    required this.isPermissionGranted,
    required this.onOpenSettings,
    required this.onClearAllData,
    required this.onLockApp,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricEnabled = true;
  String? _currentName;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final name = await LocalExpenseStorage.getUserName();
    setState(() {
      _currentName = name;
    });
  }

  void _showChangePinDialog() {
    final oldPinController = TextEditingController();
    final newPinController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change Security PIN'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 4,
              decoration: const InputDecoration(
                labelText: 'Current PIN',
                hintText: '••••',
                counterText: '',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 4,
              decoration: const InputDecoration(
                labelText: 'New 4-Digit PIN',
                hintText: '••••',
                counterText: '',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final oldEntered = oldPinController.text.trim();
              final newEntered = newPinController.text.trim();
              final saved = await LocalExpenseStorage.getSavedPin();

              if (saved != null && saved.isNotEmpty && oldEntered != saved) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Current PIN does not match!')),
                );
                return;
              }

              if (newEntered.length != 4) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('New PIN must be 4 digits')),
                );
                return;
              }

              await LocalExpenseStorage.savePin(newEntered);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('PIN successfully updated!'),
                  backgroundColor: Color(0xFF0F766E),
                ),
              );
            },
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0F766E)),
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // User Profile Mini Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: const Color(0xFF0F766E),
                  child: Text(
                    (_currentName != null && _currentName!.isNotEmpty)
                        ? _currentName!.substring(0, 1).toUpperCase()
                        : 'U',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _currentName != null && _currentName!.isNotEmpty
                            ? _currentName!
                            : 'Personal Expense Account',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        '100% Local & Offline Encrypted',
                        style: TextStyle(fontSize: 12, color: Color(0xFF0F766E), fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Section: Android Permissions
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Text(
            'UPI LISTENER PERMISSION',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8),
          ),
        ),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            leading: Icon(
              widget.isPermissionGranted ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
              color: widget.isPermissionGranted ? const Color(0xFF0F766E) : Colors.amber.shade800,
            ),
            title: const Text('Notification Listener Access', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: Text(
              widget.isPermissionGranted ? 'Granted & Intercepting Payments' : 'Disabled - Tap to enable',
              style: TextStyle(
                fontSize: 12,
                color: widget.isPermissionGranted ? const Color(0xFF0F766E) : Colors.redAccent,
              ),
            ),
            trailing: OutlinedButton(
              onPressed: widget.onOpenSettings,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: widget.isPermissionGranted ? const Color(0xFF0F766E) : Colors.amber.shade800),
              ),
              child: const Text('Settings'),
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Section: Security
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Text(
            'SECURITY & ACCESS',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8),
          ),
        ),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.pin_rounded, color: Color(0xFF0F766E)),
                title: const Text('Change Security PIN', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: const Text('Update 4-digit unlock code', style: TextStyle(fontSize: 12)),
                trailing: const Icon(Icons.chevron_right, size: 20),
                onTap: _showChangePinDialog,
              ),
              const Divider(height: 1, indent: 56),
              SwitchListTile(
                secondary: const Icon(Icons.fingerprint_rounded, color: Color(0xFF0F766E)),
                title: const Text('Biometric Unlock', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: const Text('Allow fingerprint / face unlock', style: TextStyle(fontSize: 12)),
                value: _biometricEnabled,
                activeColor: const Color(0xFF0F766E),
                onChanged: (val) => setState(() => _biometricEnabled = val),
              ),
              const Divider(height: 1, indent: 56),
              ListTile(
                leading: const Icon(Icons.lock_clock_outlined, color: Color(0xFF475569)),
                title: const Text('Lock App Now', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                subtitle: const Text('Return immediately to PIN screen', style: TextStyle(fontSize: 12)),
                onTap: widget.onLockApp,
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Section: Data Management
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Text(
            'DATA MANAGEMENT',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.8),
          ),
        ),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            leading: const Icon(Icons.delete_forever_rounded, color: Colors.redAccent),
            title: const Text('Clear All Expense Records', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.redAccent, fontSize: 14)),
            subtitle: const Text('Wipe all tracked payments for a clean slate', style: TextStyle(fontSize: 12)),
            onTap: widget.onClearAllData,
          ),
        ),

        const SizedBox(height: 24),

        // Footer version info
        Center(
          child: Text(
            'UPI Expense Tracker v1.0.0\nZero-Cloud • Privacy-Preserving',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 11, height: 1.5),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
