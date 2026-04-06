import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _sub;

  final _controller = StreamController<bool>.broadcast();
  Stream<bool> get isOnlineStream => _controller.stream;

  bool _last = true;
  bool get lastKnownOnline => _last;

  Future<void> start() async {
    // ✅ NEW API returns List<ConnectivityResult>
    final initialResults = await _connectivity.checkConnectivity();
    _push(initialResults);

    _sub = _connectivity.onConnectivityChanged.listen((results) {
      _push(results);
    });
  }

  void _push(List<ConnectivityResult> results) {
    final online = results.any(
      (r) => r != ConnectivityResult.none,
    );

    _last = online;
    _controller.add(online);
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    await _controller.close();
  }
}
