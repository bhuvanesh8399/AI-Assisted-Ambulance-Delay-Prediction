import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../main.dart';
import '../../core/constants/app_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/network/models.dart';
import '../../core/network/trip_api.dart';
import '../../core/services/gps_buffer.dart';
import '../../core/services/gps_uploader.dart';
import '../../core/services/location_service.dart';
import '../../core/services/snapshot_poller.dart';
import '../../core/storage/prefs.dart';
import '../../core/utils/time_utils.dart';
import '../../core/utils/ui_utils.dart';

class LiveTripPage extends StatefulWidget {
  const LiveTripPage({
    super.key,
    this.initialTripId,
    this.initialHospitalId,
  });

  final String? initialTripId;
  final String? initialHospitalId;

  @override
  State<LiveTripPage> createState() => _LiveTripPageState();
}

class _LiveTripPageState extends State<LiveTripPage> {
  String? tripId;
  String? hospitalId;

  TripApi? api;
  final connectivity = connectivityService;
  late final LocationService location;

  late final GpsBuffer gpsBuffer;
  GpsUploader? gpsUploader;

  SnapshotPoller? poller;
  StreamSubscription? snapSub;
  StreamSubscription? onlineSub;

  TripSnapshot? lastSnapshot;

  bool isOnline = true;
  bool arrived = false;

  String logLine = '';

  @override
  void initState() {
    super.initState();
    location = LocationService();
    gpsBuffer = GpsBuffer();

    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    tripId = (widget.initialTripId ?? args?['tripId'] ?? '').toString();
    hospitalId = (widget.initialHospitalId ?? args?['hospitalId'] ?? '').toString();

    final prefs = await Prefs.create();
    final baseUrl = prefs.getBaseUrl();
    if (baseUrl == null || baseUrl.isEmpty) {
      showSnack(context, 'Backend URL missing (Setup required)');
      return;
    }

    api = TripApi(ApiClient(baseUrl: baseUrl));

    isOnline = connectivity.lastKnownOnline;

    onlineSub = connectivity.isOnlineStream.listen((online) {
      setState(() => isOnline = online);
    });

    // Permissions gate
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

    // Start GPS uploader
    gpsUploader = GpsUploader(
      tripApi: api!,
      buffer: gpsBuffer,
      isOnlineProvider: () => isOnline,
    );

    gpsUploader!.start(
      tripId: tripId!,
      readPosition: () async {
        final pos = await location.getCurrentPosition();
        return GpsPayload(
          tripId: tripId!,
          lat: pos.latitude,
          lon: pos.longitude,
          at: DateTime.now(),
        );
      },
      onLog: _log,
    );

    // Start snapshot polling
    poller = SnapshotPoller(api!);
    poller!.start(tripId!, onLog: _log);

    snapSub = poller!.stream.listen((snap) {
      setState(() {
        lastSnapshot = snap;
        if ((snap.status ?? '').toUpperCase() == 'ARRIVED') {
          arrived = true;
        }
      });

      if (arrived) {
        _stopLoops();
      }
    });
  }

  void _log(String msg) {
    setState(() => logLine = msg);
  }

  void _stopLoops() {
    gpsUploader?.stop();
    poller?.stop();
  }

  @override
  void dispose() {
    _stopLoops();
    snapSub?.cancel();
    onlineSub?.cancel();
    poller?.dispose();
    super.dispose();
  }

  bool get isLive {
    final age = secondsAgo(lastSnapshot?.lastUpdate);
    return age <= AppConstants.liveThresholdSeconds;
  }

  int get lastAgeSeconds => secondsAgo(lastSnapshot?.lastUpdate);

  Future<void> _sendArrived() async {
    if (tripId == null || api == null) return;

    setState(() => arrived = true);
    _stopLoops();

    try {
      await api!.arrive(tripId!);
      if (!mounted) return;
      showSnack(context, 'Arrived sent');
    } catch (e) {
      if (!mounted) return;
      showSnack(context, 'Arrive failed: $e');
    }
  }

  Future<void> _sendNearArrival() async {
    if (tripId == null || api == null) return;

    try {
      await api!.nearArrival(tripId!);
      if (!mounted) return;
      showSnack(context, 'Near-arrival sent');
    } catch (e) {
      if (!mounted) return;
      showSnack(context, 'Near-arrival failed: $e');
    }
  }

  Future<void> _callHospital() async {
    // Placeholder SOP fallback. Replace with real phone from hospital registry later.
    // If no phone: show message.
    const phone = null; // e.g., "+919876543210"
    if (phone == null) {
      showSnack(context, 'Phone unavailable — use manual call');
      return;
    }
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      showSnack(context, 'Cannot open dialer');
    }
  }

  @override
  Widget build(BuildContext context) {
    final eta = lastSnapshot?.etaSeconds;
    final etaText = eta == null ? 'Unavailable' : formatEta(eta);

    final risk = (lastSnapshot?.risk ?? 'Unavailable').toUpperCase();
    final status = (lastSnapshot?.status ?? 'EN_ROUTE').toUpperCase();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Trip'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // LIVE/STALE + OFFLINE banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (!isOnline)
                    ? Colors.red.withOpacity(0.15)
                    : (isLive ? Colors.green.withOpacity(0.15) : Colors.orange.withOpacity(0.15)),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (!isOnline)
                      ? Colors.red
                      : (isLive ? Colors.green : Colors.orange),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    !isOnline
                        ? 'OFFLINE — use phone backup'
                        : (isLive ? 'LIVE' : 'STALE'),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Last updated: ${lastAgeSeconds}s ago',
                    style: const TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Big ETA
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Final ETA', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(
                    etaText,
                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Risk + Status
            Row(
              children: [
                Expanded(
                  child: _chipCard('Risk', risk),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _chipCard('Status', status),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: OutlinedButton(
                      onPressed: arrived ? null : _sendNearArrival,
                      child: const Text('NEAR ARRIVAL'),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: arrived ? null : _sendArrived,
                      child: Text(arrived ? 'ARRIVED' : 'ARRIVED (SEND)'),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: OutlinedButton(
                      onPressed: _callHospital,
                      child: const Text('CALL HOSPITAL'),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Debug line (safe for demo; remove later)
            Text(
              logLine.isEmpty ? 'Sending GPS every ${AppConstants.gpsIntervalSeconds}s' : logLine,
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chipCard(String title, String value) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
