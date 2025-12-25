import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  ApiConfig(this._prefs);

  final SharedPreferences _prefs;

  static const _kAmbulanceId = 'ambulance_id';
  static const _kBaseUrl = 'base_url';
  static const _kLangCode = 'lang_code';

  String getAmbulanceId() => _prefs.getString(_kAmbulanceId) ?? '';
  String getBaseUrl() => _prefs.getString(_kBaseUrl) ?? 'http://127.0.0.1:8000';
  String? getLanguageCode() => _prefs.getString(_kLangCode);

  Future<void> setAmbulanceId(String id) => _prefs.setString(_kAmbulanceId, id.trim());
  Future<void> setBaseUrl(String url) => _prefs.setString(_kBaseUrl, url.trim());
  Future<void> setLanguageCode(String code) => _prefs.setString(_kLangCode, code.trim());

  bool hasMinimumSetup() {
    final id = getAmbulanceId().trim();
    final url = getBaseUrl().trim();
    return id.isNotEmpty && url.isNotEmpty;
  }
}
