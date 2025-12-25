import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ambulance_app/core/i18n/app_localizations.dart';

import '../../core/widgets/primary_button.dart';
import '../../core/widgets/status_chip.dart';
import '../settings/language_sheet.dart';

enum Connectivity { online, weak, offline }

class LiveTripPage extends StatefulWidget {
  const LiveTripPage({
    super.key,
    required this.tripId,
    required this.onChangeLocale,
  });

  final String tripId;
  final ValueChanged<Locale> onChangeLocale;

  @override
  State<LiveTripPage> createState() => _LiveTripPageState();
}

class _LiveTripPageState extends State<LiveTripPage> {
  TripStatus _status = TripStatus.enRoute;
  Connectivity _conn = Connectivity.online;

  String get _fakeEta => '--:--';
  String get _fakeRisk => '—';

  void _openLanguage() {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) => LanguageSheet(onSelect: widget.onChangeLocale),
    );
  }

  Color _connColor(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    switch (_conn) {
      case Connectivity.online:
        return Colors.green.withOpacity(0.22);
      case Connectivity.weak:
        return scheme.secondary.withOpacity(0.22);
      case Connectivity.offline:
        return scheme.error.withOpacity(0.22);
    }
  }

  String _connLabel(AppLocalizations t) {
    switch (_conn) {
      case Connectivity.online:
        return t.online;
      case Connectivity.weak:
        return t.weak;
      case Connectivity.offline:
        return t.offline;
    }
  }

  void _callHospitalPlaceholder() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context)!.dialerNotAvailable)),
    );
  }

  void _markArrivedPlaceholder() {
    setState(() => _status = TripStatus.arrived);
    HapticFeedback.mediumImpact();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.liveTripTitle),
        actions: [
          IconButton(
            onPressed: _openLanguage,
            icon: const Icon(Icons.translate),
            tooltip: t.language,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          _ConnectivityBanner(
            label: _connLabel(t),
            bg: _connColor(context),
            onChange: (c) => setState(() => _conn = c),
          ),
          const SizedBox(height: 10),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.tripId,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 6),
                  SelectableText(
                    widget.tripId,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      StatusChip(
                        status: _status,
                        label: _statusLabel(t, _status),
                      ),
                      Chip(
                        avatar: const Icon(Icons.warning_rounded, size: 18),
                        label: Text('${t.risk}: $_fakeRisk'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Icon(Icons.schedule_rounded, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      t.finalEta,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(
                    _fakeEta,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ),
          ),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t.status,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 10),
                  SegmentedButton<TripStatus>(
                    segments: [
                      ButtonSegment(
                        value: TripStatus.enRoute,
                        label: Text(t.enRoute),
                        icon: const Icon(Icons.local_shipping_rounded),
                      ),
                      ButtonSegment(
                        value: TripStatus.nearArrival,
                        label: Text(t.nearArrival),
                        icon: const Icon(Icons.timer_rounded),
                      ),
                      ButtonSegment(
                        value: TripStatus.arrived,
                        label: Text(t.arrived),
                        icon: const Icon(Icons.flag_rounded),
                      ),
                    ],
                    selected: {_status},
                    onSelectionChanged: (s) => setState(() => _status = s.first),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 6),
          PrimaryButton(
            label: t.callHospital,
            icon: Icons.call_rounded,
            onPressed: _callHospitalPlaceholder,
          ),
          const SizedBox(height: 10),
          PrimaryButton(
            label: t.arrivedAction,
            icon: Icons.check_circle_rounded,
            isDanger: false,
            onPressed: _markArrivedPlaceholder,
          ),
          const SizedBox(height: 14),
        ],
      ),
    );
  }

  String _statusLabel(AppLocalizations t, TripStatus s) {
    switch (s) {
      case TripStatus.enRoute:
        return t.enRoute;
      case TripStatus.nearArrival:
        return t.nearArrival;
      case TripStatus.arrived:
        return t.arrived;
    }
  }
}

class _ConnectivityBanner extends StatelessWidget {
  const _ConnectivityBanner({
    required this.label,
    required this.bg,
    required this.onChange,
  });

  final String label;
  final Color bg;
  final ValueChanged<Connectivity> onChange;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          const Icon(Icons.wifi_rounded),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '${t.connectivity}: $label',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
          PopupMenuButton<Connectivity>(
            icon: const Icon(Icons.tune_rounded),
            itemBuilder: (_) => [
              PopupMenuItem(
                value: Connectivity.online,
                child: Text(t.online),
              ),
              PopupMenuItem(
                value: Connectivity.weak,
                child: Text(t.weak),
              ),
              PopupMenuItem(
                value: Connectivity.offline,
                child: Text(t.offline),
              ),
            ],
            onSelected: onChange,
          ),
        ],
      ),
    );
  }
}
