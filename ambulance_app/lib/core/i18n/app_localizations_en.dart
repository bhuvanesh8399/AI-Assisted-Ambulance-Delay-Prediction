// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get language => 'Language';

  @override
  String get setupTitle => 'Setup';

  @override
  String get setupHint => 'Enter ambulance ID and backend URL.';

  @override
  String get ambulanceId => 'Ambulance ID';

  @override
  String get backendBaseUrl => 'Backend Base URL';

  @override
  String get backendHint => 'Example: http://127.0.0.1:8000';

  @override
  String get saveAndContinue => 'Save & Continue';

  @override
  String get saving => 'Saving...';

  @override
  String get fillAllFields => 'Please fill all fields';

  @override
  String get startTripTitle => 'Start Trip';

  @override
  String get startTripHint => 'Select destination hospital to begin.';

  @override
  String get destinationHospital => 'Destination Hospital';

  @override
  String get destinationHint => 'Example: HOSP-07';

  @override
  String get startTrip => 'Start Trip';

  @override
  String get liveTripTitle => 'Live Trip';

  @override
  String get tripId => 'Trip ID';

  @override
  String get finalEta => 'Final ETA';

  @override
  String get risk => 'Risk';

  @override
  String get status => 'Status';

  @override
  String get enRoute => 'EN ROUTE';

  @override
  String get nearArrival => 'NEAR ARRIVAL';

  @override
  String get arrived => 'ARRIVED';

  @override
  String get connectivity => 'Connectivity';

  @override
  String get online => 'ONLINE';

  @override
  String get weak => 'WEAK';

  @override
  String get offline => 'OFFLINE';

  @override
  String get callHospital => 'Call Hospital';

  @override
  String get arrivedAction => 'Arrived';

  @override
  String get dialerNotAvailable => 'Dialer not available on this device';
}
