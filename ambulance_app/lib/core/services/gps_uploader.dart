import 'dart:async';
import '../constants/app_constants.dart';
import '../network/trip_api.dart';
import 'gps_buffer.dart';

class GpsUploader {
  GpsUploader({
    required this.tripApi,
    required this.buffer,
    required this.isOnlineProvider,
  });

  final TripApi tripApi;
  final GpsBuffer buffer;
  final bool Function() isOnlineProvider;

  Timer? _timer;
  bool _running = false;

  void start({
    required String tripId,
    required Future<GpsPayload?> Function() readPosition,
    void Function(String msg)? onLog,
  }) {
    if (_running) return;
    _running = true;

    _timer = Timer.periodic(
      const Duration(seconds: AppConstants.gpsIntervalSeconds),
      (_) async {
        try {
          final payload = await readPosition();
          if (payload == null) return;

          if (!isOnlineProvider()) {
            buffer.push(payload);
            onLog?.call('OFFLINE: buffered GPS (${buffer.length})');
            return;
          }

          // Flush first (FIFO) then send current
          await _flushIfNeeded(onLog);

          await tripApi.gpsUpdate(tripId: tripId, lat: payload.lat, lon: payload.lon);
          onLog?.call('GPS sent: ${payload.lat.toStringAsFixed(5)}, ${payload.lon.toStringAsFixed(5)}');
        } catch (e) {
          onLog?.call('GPS send failed: $e');
        }
      },
    );
  }

  Future<void> _flushIfNeeded(void Function(String msg)? onLog) async {
    if (buffer.isEmpty) return;
    if (!isOnlineProvider()) return;

    final items = buffer.drainAll();
    onLog?.call('Flushing buffered updates: ${items.length}');

    for (final p in items) {
      try {
        await tripApi.gpsUpdate(tripId: p.tripId, lat: p.lat, lon: p.lon);
      } catch (_) {
        // if flush fails mid-way, re-buffer remaining
        buffer.push(p);
        onLog?.call('Flush interrupted, re-buffering...');
        break;
      }
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _running = false;
  }
}
