import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/config/api_config.dart';
import '../core/network/api_client.dart';
import '../features/setup/setup_page.dart';
import '../features/trip/start_trip_page.dart';
import '../features/trip/live_trip_page.dart';

GoRouter buildRouter({
  required ApiConfig config,
  required ApiClient apiClient,
  required ValueChanged<Locale> onChangeLocale,
}) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) {
          final hasSetup = config.hasMinimumSetup();
          return hasSetup ? '/trip/start' : '/setup';
        },
      ),
      GoRoute(
        path: '/setup',
        builder: (context, state) => SetupPage(
          config: config,
          onChangeLocale: onChangeLocale,
        ),
      ),
      GoRoute(
        path: '/trip/start',
        builder: (context, state) => StartTripPage(
          config: config,
          apiClient: apiClient,
          onChangeLocale: onChangeLocale,
        ),
      ),
      GoRoute(
        path: '/trip/live/:tripId',
        builder: (context, state) {
          final tripId = state.pathParameters['tripId'] ?? 'TRIP-DEMO';
          return LiveTripPage(
            tripId: tripId,
            onChangeLocale: onChangeLocale,
          );
        },
      ),
    ],
  );
}
