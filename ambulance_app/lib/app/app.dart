import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/api_config.dart';
import '../core/network/api_client.dart';
import '../core/i18n/app_localizations.dart';
import 'router.dart';
import 'theme.dart';

class AmbulanceApp extends StatefulWidget {
  const AmbulanceApp({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<AmbulanceApp> createState() => _AmbulanceAppState();
}

class _AmbulanceAppState extends State<AmbulanceApp> {
  late final ApiConfig _config;
  late final ApiClient _apiClient;
  Locale? _locale;

  @override
  void initState() {
    super.initState();
    _config = ApiConfig(widget.prefs);
    _apiClient = ApiClient(_config);

    final saved = _config.getLanguageCode();
    if (saved != null && saved.isNotEmpty) {
      _locale = Locale(saved);
    }
  }

  void _setLocale(Locale locale) async {
    setState(() => _locale = locale);
    await _config.setLanguageCode(locale.languageCode);
  }

  @override
  Widget build(BuildContext context) {
    final router = buildRouter(
      config: _config,
      apiClient: _apiClient,
      onChangeLocale: _setLocale,
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'Ambulance Driver',
      theme: buildEmsTheme(),
      routerConfig: router,
      locale: _locale,
      supportedLocales: const [
        Locale('en'),
        Locale('ta'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }
}
