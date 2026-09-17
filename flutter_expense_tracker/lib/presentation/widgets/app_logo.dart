import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Modern vector App Logo for UPI Expense Tracker
class AppLogo extends StatelessWidget {
  final double size;
  final bool showGlow;

  const AppLogo({
    super.key,
    this.size = 80,
    this.showGlow = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0F766E), // Teal 700
            Color(0xFF042F2E), // Dark Teal
          ],
        ),
        boxShadow: showGlow
            ? [
                BoxShadow(
                  color: const Color(0xFF0F766E).withOpacity(0.35),
                  blurRadius: size * 0.3,
                  offset: Offset(0, size * 0.1),
                ),
              ]
            : null,
      ),
      child: Center(
        child: CustomPaint(
          size: Size(size * 0.6, size * 0.6),
          painter: _LogoPainter(),
        ),
      ),
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Glowing accent paint
    final glowPaint = Paint()
      ..color = const Color(0xFF34D399) // Mint emerald
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.12
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final secondaryPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.1
      ..strokeCap = StrokeCap.round;

    // Horizontal top bar of currency
    canvas.drawLine(
      Offset(w * 0.2, h * 0.22),
      Offset(w * 0.8, h * 0.22),
      secondaryPaint,
    );

    // Second horizontal bar
    canvas.drawLine(
      Offset(w * 0.2, h * 0.42),
      Offset(w * 0.68, h * 0.42),
      secondaryPaint,
    );

    // Dynamic curved stroke with lightning flash
    final path = Path();
    path.moveTo(w * 0.35, h * 0.22);
    path.lineTo(w * 0.35, h * 0.55);
    path.quadraticBezierTo(w * 0.68, h * 0.55, w * 0.68, h * 0.38);

    canvas.drawPath(path, secondaryPaint);

    // Downward forward arrow / lightning spark (Instant tracking)
    final sparkPath = Path();
    sparkPath.moveTo(w * 0.32, h * 0.55);
    sparkPath.lineTo(w * 0.72, h * 0.88);
    sparkPath.lineTo(w * 0.58, h * 0.88);
    canvas.drawPath(sparkPath, glowPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Animated Loading Logo with orbital pulse and rotating progress halo
class LoadingLogo extends StatefulWidget {
  final double size;
  final String statusMessage;

  const LoadingLogo({
    super.key,
    this.size = 90,
    this.statusMessage = 'Decrypting secure offline ledger...',
  });

  @override
  State<LoadingLogo> createState() => _LoadingLogoState();
}

class _LoadingLogoState extends State<LoadingLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                // Outer rotating gradient ring
                Transform.rotate(
                  angle: _controller.value * 2 * math.pi,
                  child: Container(
                    width: widget.size * 1.35,
                    height: widget.size * 1.35,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: SweepGradient(
                        colors: [
                          const Color(0xFF0F766E).withOpacity(0.0),
                          const Color(0xFF10B981).withOpacity(0.4),
                          const Color(0xFF0F766E),
                        ],
                        stops: const [0.0, 0.7, 1.0],
                      ),
                    ),
                  ),
                ),
                // Inner mask for ring
                Container(
                  width: widget.size * 1.25,
                  height: widget.size * 1.25,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAF9),
                    shape: BoxShape.circle,
                  ),
                ),
                // Center App Logo with subtle scale pulse
                Transform.scale(
                  scale: 0.96 + (math.sin(_controller.value * 2 * math.pi) * 0.04),
                  child: AppLogo(
                    size: widget.size,
                    showGlow: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              widget.statusMessage,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFF4B5563),
                letterSpacing: 0.2,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        );
      },
    );
  }
}
