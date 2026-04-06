import 'package:shared_preferences/shared_preferences.dart';

class PrefKeys {
  static const ambulanceId = 'ambulance_id';
  static const backendBaseUrl = 'backend_base_url';
  static const lastTripId = 'last_trip_id';
}

class Prefs {
  Prefs(this._sp);
  final SharedPreferences _sp;

  static Future<Prefs> create() async {
    final sp = await SharedPreferences.getInstance();
    return Prefs(sp);
  }

  String? getAmbulanceId() => _sp.getString(PrefKeys.ambulanceId);
  String? getBaseUrl() => _sp.getString(PrefKeys.backendBaseUrl);
  Future<void> setAmbulanceId(String id) => _sp.setString(PrefKeys.ambulanceId, id);
  Future<void> setBaseUrl(String url) => _sp.setString(PrefKeys.backendBaseUrl, url);

  Future<void> setLastTripId(String tripId) => _sp.setString(PrefKeys.lastTripId, tripId);
  String? getLastTripId() => _sp.getString(PrefKeys.lastTripId);
}
