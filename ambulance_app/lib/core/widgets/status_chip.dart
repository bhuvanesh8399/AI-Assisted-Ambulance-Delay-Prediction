import 'package:flutter/material.dart';

enum TripStatus { enRoute, nearArrival, arrived }

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status, required this.label});

  final TripStatus status;
  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    Color bg;
    IconData icon;

    switch (status) {
      case TripStatus.enRoute:
        bg = scheme.primary.withOpacity(0.25);
        icon = Icons.local_shipping_rounded;
        break;
      case TripStatus.nearArrival:
        bg = scheme.secondary.withOpacity(0.25);
        icon = Icons.timer_rounded;
        break;
      case TripStatus.arrived:
        bg = Colors.green.withOpacity(0.25);
        icon = Icons.flag_rounded;
        break;
    }

    return Chip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      backgroundColor: bg,
    );
  }
}
