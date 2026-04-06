import '../constants/app_constants.dart';

class GpsPayload {
  final String tripId;
  final double lat;
  final double lon;
  final DateTime at;

  GpsPayload({
    required this.tripId,
    required this.lat,
    required this.lon,
    required this.at,
  });
}

class GpsBuffer {
  final List<GpsPayload> _q = [];

  int get length => _q.length;
  bool get isEmpty => _q.isEmpty;

  void push(GpsPayload p) {
    _q.add(p);
    if (_q.length > AppConstants.gpsBufferMax) {
      _q.removeAt(0); // drop oldest
    }
  }

  List<GpsPayload> drainAll() {
    final copy = List<GpsPayload>.from(_q);
    _q.clear();
    return copy;
  }
}
