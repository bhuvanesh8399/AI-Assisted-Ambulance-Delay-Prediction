import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:geolocator/geolocator.dart';

import '../../core/storage/prefs.dart';
import '../../core/network/api_client.dart';
import '../../core/network/trip_api.dart';
import '../../core/services/location_service.dart';
import '../../core/utils/ui_utils.dart';

class StartTripPage extends StatefulWidget {
  const StartTripPage({super.key});

  @override
  State<StartTripPage> createState() => _StartTripPageState();
}

class _StartTripPageState extends State<StartTripPage> {
  final _hospitalCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _hospitalCtrl.dispose();
    super.dispose();
  }

  Future<void> _startTrip() async {
    setState(() => _loading = true);

    try {
      final prefs = await Prefs.create();
      final ambulanceId = prefs.getAmbulanceId();
      final baseUrl = prefs.getBaseUrl();

      if (ambulanceId == null || ambulanceId.isEmpty) {
        showSnack(context, 'Ambulance ID missing (Setup required)');
        return;
      }
      if (baseUrl == null || baseUrl.isEmpty) {
        showSnack(context, 'Backend URL missing (Setup required)');
        return;
      }
      final hospitalId = _hospitalCtrl.text.trim();
      if (hospitalId.isEmpty) {
        showSnack(context, 'Enter destination hospital ID');
        return;
      }

      final location = LocationService();

      final serviceEnabled = await location.ensureServiceEnabled();
      if (!serviceEnabled) {
        showSnack(context, 'Enable GPS / Location services');
        return;
      }

      final perm = await location.ensurePermission();
      if (perm == LocationPermission.denied) {
        showSnack(context, 'Location permission required');
        return;
      }
      if (perm == LocationPermission.deniedForever) {
        showSnack(context, 'Location permission permanently denied. Enable in settings.');
        return;
      }

      final pos = await location.getCurrentPosition();

      final api = TripApi(ApiClient(baseUrl: baseUrl));
      final res = await api.startTrip(
        ambulanceId: ambulanceId,
        hospitalId: hospitalId,
        startLat: pos.latitude,
        startLon: pos.longitude,
      );

      if (res.tripId.isEmpty) {
        showSnack(context, 'Trip start failed (trip_id empty)');
        return;
      }

      await prefs.setLastTripId(res.tripId);

      if (!mounted) return;
      showSnack(context, 'Trip started: ${res.tripId}');
      context.go('/trip/live/${res.tripId}');
    } catch (e) {
      showSnack(context, 'Trip start failed: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // driver-first: big button + minimal fields
    return Scaffold(
      appBar: AppBar(title: const Text('Start Trip')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _hospitalCtrl,
              decoration: const InputDecoration(
                labelText: 'Destination Hospital ID',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 56,
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _startTrip,
                child: Text(_loading ? 'Starting…' : 'START TRIP'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
