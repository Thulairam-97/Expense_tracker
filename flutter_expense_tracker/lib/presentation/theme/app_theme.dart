import 'package:flutter/material.dart';

class AppTheme {
  // Brand color scheme: Deep Emerald / Mint tones representing wealth & clarity
  static const Color primarySeed = Color(0xFF0F766E); // Teal 700

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primarySeed,
      brightness: Brightness.light,
      surface: const Color(0xFFFBFDFA),
      surfaceContainerLowest: const Color(0xFFFFFFFF),
      surfaceContainerLow: const Color(0xFFF3F6F3),
      surfaceContainer: const Color(0xFFECF0ED),
      surfaceContainerHigh: const Color(0xFFE6EAE7),
      surfaceContainerHighest: const Color(0xFFE0E5E2),
    ),
    scaffoldBackgroundColor: const Color(0xFFF8FAF9),
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 1,
      backgroundColor: Color(0xFFF8FAF9),
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Color(0xFF191C1B),
        letterSpacing: -0.2,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE0E5E2), width: 1),
      ),
      color: Colors.white,
    ),
    navigationBarTheme: NavigationBarThemeData(
      elevation: 2,
      backgroundColor: Colors.white,
      indicatorColor: const Color(0xFFCCE8E3),
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Color(0xFF0F766E),
          );
        }
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Color(0xFF6F7976),
        );
      }),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      elevation: 2,
      highlightElevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: const Color(0xFF0F766E),
      foregroundColor: Colors.white,
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primarySeed,
      brightness: Brightness.dark,
      surface: const Color(0xFF111413),
      surfaceContainerLowest: const Color(0xFF0C0F0E),
      surfaceContainerLow: const Color(0xFF191C1B),
      surfaceContainer: const Color(0xFF1D201F),
      surfaceContainerHigh: const Color(0xFF272B2A),
      surfaceContainerHighest: const Color(0xFF323635),
    ),
    scaffoldBackgroundColor: const Color(0xFF0E1110),
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 1,
      backgroundColor: Color(0xFF0E1110),
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Color(0xFFE1E3E1),
        letterSpacing: -0.2,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF272B2A), width: 1),
      ),
      color: const Color(0xFF151918),
    ),
  );
}
