import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';

import 'core/config/api_config.dart';
import 'core/services/connectivity_service.dart';
import 'core/i18n/app_localizations.dart';

import 'features/setup/setup_page.dart';
import 'features/start_trip/start_trip_page.dart';
import 'features/live_trip/live_trip_page.dart';

final ConnectivityService connectivityService = ConnectivityService();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Global connectivity monitor (do NOT start/stop per screen)
  await connectivityService.start();

  // ApiConfig usually wraps SharedPreferences internally; keep it async-safe
  final config = await ApiConfig.create();

  runApp(AmbulanceApp(config: config));
}

class AmbulanceApp extends StatefulWidget {
  const AmbulanceApp({super.key, required this.config});

  final ApiConfig config;

  @override
  State<AmbulanceApp> createState() => _AmbulanceAppState();
}

class _AmbulanceAppState extends State<AmbulanceApp> {
  Locale? _locale;

  late final GoRouter _router = GoRouter(
    initialLocation: '/setup',
    routes: [
      GoRoute(
        path: '/setup',
        builder: (context, state) => SetupPage(
          config: widget.config,
          onChangeLocale: _setLocale,
        ),
      ),
      GoRoute(
        path: '/trip/start',
        builder: (context, state) => const StartTripPage(),
      ),
      GoRoute(
        path: '/trip/live/:tripId',
        builder: (context, state) {
          final tripId = state.pathParameters['tripId']!;
          return LiveTripPage(
            initialTripId: tripId,
          );
        },
      ),
    ],
  );

  void _setLocale(Locale locale) {
    setState(() => _locale = locale);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Ambulance Driver',
      theme: ThemeData.dark().copyWith(useMaterial3: true),

      routerConfig: _router,

      // ✅ i18n
      locale: _locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
