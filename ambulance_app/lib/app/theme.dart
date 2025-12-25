import 'package:flutter/material.dart';

ThemeData buildEmsTheme() {
  const bg = Color(0xFF0B1220);
  const surface = Color(0xFF121B2E);
  const primary = Color(0xFF4C7DFF);
  const danger = Color(0xFFFF4D4D);
  const success = Color(0xFF21C179);
  const warning = Color(0xFFFFC857);

  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      surface: surface,
      primary: primary,
      secondary: warning,
      error: danger,
    ),
    scaffoldBackgroundColor: bg,
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      elevation: 0,
      backgroundColor: bg,
      foregroundColor: Colors.white,
    ),
    cardTheme: const CardThemeData(
      color: surface,
      elevation: 4,
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(18)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
      ),
    ),
    textTheme: base.textTheme.copyWith(
      titleLarge: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
      titleMedium: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
      bodyLarge: const TextStyle(fontSize: 16, height: 1.3),
      bodyMedium: const TextStyle(fontSize: 14, height: 1.3),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(56), // >= 48px touch target
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      labelStyle: const TextStyle(fontWeight: FontWeight.w700),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    ),
    dividerTheme: DividerThemeData(
      color: Colors.white.withOpacity(0.10),
      thickness: 1,
    ),
    extensions: const [
      EmsColors(
        bg: bg,
        surface: surface,
        danger: danger,
        success: success,
        warning: warning,
      ),
    ],
  );
}

@immutable
class EmsColors extends ThemeExtension<EmsColors> {
  const EmsColors({
    required this.bg,
    required this.surface,
    required this.danger,
    required this.success,
    required this.warning,
  });

  final Color bg;
  final Color surface;
  final Color danger;
  final Color success;
  final Color warning;

  @override
  EmsColors copyWith({
    Color? bg,
    Color? surface,
    Color? danger,
    Color? success,
    Color? warning,
  }) {
    return EmsColors(
      bg: bg ?? this.bg,
      surface: surface ?? this.surface,
      danger: danger ?? this.danger,
      success: success ?? this.success,
      warning: warning ?? this.warning,
    );
  }

  @override
  EmsColors lerp(ThemeExtension<EmsColors>? other, double t) {
    if (other is! EmsColors) return this;
    return EmsColors(
      bg: Color.lerp(bg, other.bg, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
    );
  }
}
