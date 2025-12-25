import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ta.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'i18n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ta'),
  ];

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @setupTitle.
  ///
  /// In en, this message translates to:
  /// **'Setup'**
  String get setupTitle;

  /// No description provided for @setupHint.
  ///
  /// In en, this message translates to:
  /// **'Enter ambulance ID and backend URL.'**
  String get setupHint;

  /// No description provided for @ambulanceId.
  ///
  /// In en, this message translates to:
  /// **'Ambulance ID'**
  String get ambulanceId;

  /// No description provided for @backendBaseUrl.
  ///
  /// In en, this message translates to:
  /// **'Backend Base URL'**
  String get backendBaseUrl;

  /// No description provided for @backendHint.
  ///
  /// In en, this message translates to:
  /// **'Example: http://127.0.0.1:8000'**
  String get backendHint;

  /// No description provided for @saveAndContinue.
  ///
  /// In en, this message translates to:
  /// **'Save & Continue'**
  String get saveAndContinue;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get saving;

  /// No description provided for @fillAllFields.
  ///
  /// In en, this message translates to:
  /// **'Please fill all fields'**
  String get fillAllFields;

  /// No description provided for @startTripTitle.
  ///
  /// In en, this message translates to:
  /// **'Start Trip'**
  String get startTripTitle;

  /// No description provided for @startTripHint.
  ///
  /// In en, this message translates to:
  /// **'Select destination hospital to begin.'**
  String get startTripHint;

  /// No description provided for @destinationHospital.
  ///
  /// In en, this message translates to:
  /// **'Destination Hospital'**
  String get destinationHospital;

  /// No description provided for @destinationHint.
  ///
  /// In en, this message translates to:
  /// **'Example: HOSP-07'**
  String get destinationHint;

  /// No description provided for @startTrip.
  ///
  /// In en, this message translates to:
  /// **'Start Trip'**
  String get startTrip;

  /// No description provided for @liveTripTitle.
  ///
  /// In en, this message translates to:
  /// **'Live Trip'**
  String get liveTripTitle;

  /// No description provided for @tripId.
  ///
  /// In en, this message translates to:
  /// **'Trip ID'**
  String get tripId;

  /// No description provided for @finalEta.
  ///
  /// In en, this message translates to:
  /// **'Final ETA'**
  String get finalEta;

  /// No description provided for @risk.
  ///
  /// In en, this message translates to:
  /// **'Risk'**
  String get risk;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @enRoute.
  ///
  /// In en, this message translates to:
  /// **'EN ROUTE'**
  String get enRoute;

  /// No description provided for @nearArrival.
  ///
  /// In en, this message translates to:
  /// **'NEAR ARRIVAL'**
  String get nearArrival;

  /// No description provided for @arrived.
  ///
  /// In en, this message translates to:
  /// **'ARRIVED'**
  String get arrived;

  /// No description provided for @connectivity.
  ///
  /// In en, this message translates to:
  /// **'Connectivity'**
  String get connectivity;

  /// No description provided for @online.
  ///
  /// In en, this message translates to:
  /// **'ONLINE'**
  String get online;

  /// No description provided for @weak.
  ///
  /// In en, this message translates to:
  /// **'WEAK'**
  String get weak;

  /// No description provided for @offline.
  ///
  /// In en, this message translates to:
  /// **'OFFLINE'**
  String get offline;

  /// No description provided for @callHospital.
  ///
  /// In en, this message translates to:
  /// **'Call Hospital'**
  String get callHospital;

  /// No description provided for @arrivedAction.
  ///
  /// In en, this message translates to:
  /// **'Arrived'**
  String get arrivedAction;

  /// No description provided for @dialerNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'Dialer not available on this device'**
  String get dialerNotAvailable;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ta'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ta':
      return AppLocalizationsTa();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
