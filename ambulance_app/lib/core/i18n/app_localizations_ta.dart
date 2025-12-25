// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Tamil (`ta`).
class AppLocalizationsTa extends AppLocalizations {
  AppLocalizationsTa([String locale = 'ta']) : super(locale);

  @override
  String get language => 'மொழி';

  @override
  String get setupTitle => 'அமைப்பு';

  @override
  String get setupHint => 'ஆம்புலன்ஸ் ஐடி மற்றும் backend URL ஐ உள்ளிடுங்கள்.';

  @override
  String get ambulanceId => 'ஆம்புலன்ஸ் ஐடி';

  @override
  String get backendBaseUrl => 'Backend அடிப்படை URL';

  @override
  String get backendHint => 'உதா: http://127.0.0.1:8000';

  @override
  String get saveAndContinue => 'சேமித்து தொடரவும்';

  @override
  String get saving => 'சேமிக்கிறது...';

  @override
  String get fillAllFields => 'அனைத்து புலங்களையும் நிரப்பவும்';

  @override
  String get startTripTitle => 'பயணம் தொடங்கு';

  @override
  String get startTripHint => 'இலக்கு மருத்துவமனை தேர்வு செய்யவும்.';

  @override
  String get destinationHospital => 'இலக்கு மருத்துவமனை';

  @override
  String get destinationHint => 'உதா: HOSP-07';

  @override
  String get startTrip => 'பயணம் தொடங்கு';

  @override
  String get liveTripTitle => 'நேரடி பயணம்';

  @override
  String get tripId => 'பயண ஐடி';

  @override
  String get finalEta => 'இறுதி ETA';

  @override
  String get risk => 'அபாயம்';

  @override
  String get status => 'நிலை';

  @override
  String get enRoute => 'செல்லும் வழியில்';

  @override
  String get nearArrival => 'விரைவில் வருகை';

  @override
  String get arrived => 'வந்தடைந்தது';

  @override
  String get connectivity => 'இணைப்பு';

  @override
  String get online => 'ஆன்லைன்';

  @override
  String get weak => 'பலவீனம்';

  @override
  String get offline => 'ஆஃப்லைன்';

  @override
  String get callHospital => 'மருத்துவமனைக்கு அழை';

  @override
  String get arrivedAction => 'வந்தடைந்தேன்';

  @override
  String get dialerNotAvailable => 'இந்த சாதனத்தில் dialer இல்லை';
}
