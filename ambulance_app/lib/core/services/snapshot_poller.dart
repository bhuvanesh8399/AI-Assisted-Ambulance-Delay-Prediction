import 'dart:async';
import '../constants/app_constants.dart';
import '../network/models.dart';
import '../network/trip_api.dart';

class SnapshotPoller {
  SnapshotPoller(this.tripApi);

  final TripApi tripApi;
  Timer? _timer;

  final _controller = StreamController<TripSnapshot>.broadcast();
  Stream<TripSnapshot> get stream => _controller.stream;

  void start(String tripId, {void Function(String msg)? onLog}) {
    stop();
    _timer = Timer.periodic(
      const Duration(seconds: AppConstants.snapshotPollSeconds),
      (_) async {
        try {
          final snap = await tripApi.getSnapshot(tripId);
          _controller.add(snap);
        } catch (e) {
          onLog?.call('Snapshot poll failed: $e');
        }
      },
    );
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> dispose() async {
    stop();
    await _controller.close();
  }
}
