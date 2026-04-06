import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ambulance_app/core/i18n/app_localizations.dart';

import '../../core/config/api_config.dart';
import '../../core/widgets/primary_button.dart';

class StartTripPage extends StatefulWidget {
  const StartTripPage({
    super.key,
    required this.config,
  });

  final ApiConfig config;

  @override
  State<StartTripPage> createState() => _StartTripPageState();
}

class _StartTripPageState extends State<StartTripPage> {
  late final TextEditingController _hospitalId;

  @override
  void initState() {
    super.initState();
    _hospitalId = TextEditingController();
  }

  @override
  void dispose() {
    _hospitalId.dispose();
    super.dispose();
  }

  void _startTripUiOnly() {
    final mockTripId = 'TRIP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    context.go('/trip/live/$mockTripId');
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final ambulanceId = widget.config.getAmbulanceId();

    return Scaffold(
      appBar: AppBar(
        title: Text(t?.startTripTitle ?? 'Start Trip'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${t?.ambulanceId ?? 'Ambulance ID'}: $ambulanceId',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    t?.startTripHint ?? 'Select destination hospital to begin.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _hospitalId,
                    decoration: InputDecoration(
                      labelText: t?.destinationHospital ?? 'Destination Hospital',
                      prefixIcon: const Icon(Icons.local_hospital_rounded),
                      helperText: t?.destinationHint ?? 'Example: HOSP-07',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          PrimaryButton(
            label: t?.startTrip ?? 'Start Trip',
            icon: Icons.play_arrow_rounded,
            onPressed: _startTripUiOnly,
          ),
        ],
      ),
    );
  }
}
