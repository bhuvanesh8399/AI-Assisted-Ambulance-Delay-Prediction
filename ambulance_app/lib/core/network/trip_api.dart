import 'api_client.dart';
import 'models.dart';

class TripApi {
  TripApi(this._client);
  final ApiClient _client;

  Future<TripStartResponse> startTrip({
    required String ambulanceId,
    required String hospitalId,
    required double startLat,
    required double startLon,
  }) async {
    final res = await _client.dio.post(
      '/api/trip/start',
      data: {
        'ambulance_id': ambulanceId,
        // Backend contract expects destination_hospital_id.
        'destination_hospital_id': hospitalId,
        'start_lat': startLat,
        'start_lon': startLon,
      },
    );
    return TripStartResponse.fromJson(Map<String, dynamic>.from(res.data));
  }

  Future<void> gpsUpdate({
    required String tripId,
    required double lat,
    required double lon,
  }) async {
    await _client.dio.post(
      '/api/gps/update',
      data: {
        'trip_id': tripId,
        'lat': lat,
        'lon': lon,
      },
    );
  }

  Future<TripSnapshot> getSnapshot(String tripId) async {
    final res = await _client.dio.get('/api/trip/$tripId/snapshot');
    return TripSnapshot.fromJson(Map<String, dynamic>.from(res.data));
  }

  Future<void> arrive(String tripId) async {
    await _client.dio.post('/api/trip/$tripId/arrive');
  }

  Future<void> nearArrival(String tripId) async {
    await _client.dio.post('/api/trip/$tripId/near-arrival');
  }

  Future<void> stopTrip(String tripId) async {
    await _client.dio.post('/api/trip/$tripId/stop');
  }

  // Optional stub (later)
  Future<void> changeDestination({
    required String tripId,
    required String hospitalId,
  }) async {
    await _client.dio.patch(
      '/api/trip/$tripId/destination',
      data: {
        // Backend contract expects destination_hospital_id.
        'destination_hospital_id': hospitalId,
      },
    );
  }
}
