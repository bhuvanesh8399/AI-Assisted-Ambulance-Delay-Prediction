import '../config/api_config.dart';

class ApiClient {
  ApiClient(this._config);

  final ApiConfig _config;

  String get baseUrl => _config.getBaseUrl();

  /// Section #1: Stubs only. No HTTP calls yet.
  Future<String> startTrip({
    required String ambulanceId,
    required String hospitalId,
  }) async {
    // TODO (Section #2): POST /api/trip/start
    return 'TRIP-MOCK-001';
  }

  Future<void> sendGps({
    required String tripId,
    required double lat,
    required double lon,
  }) async {
    // TODO (Section #2): POST /api/gps/update
  }

  Future<Map<String, dynamic>> getSnapshot({required String tripId}) async {
    // TODO (Section #2): GET /api/trip/{trip_id}/snapshot
    return <String, dynamic>{
      'trip_id': tripId,
      'eta_final': '--',
      'risk': 'LOW',
      'status': 'EN_ROUTE',
    };
  }

  Future<void> arrive({required String tripId}) async {
    // TODO (Section #2): POST /api/trip/arrive
  }
}
