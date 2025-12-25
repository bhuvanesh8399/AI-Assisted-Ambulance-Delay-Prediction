import 'package:flutter/material.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.isDanger = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isDanger;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final bg = isDanger ? scheme.error : scheme.primary;

    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon ?? Icons.check_circle_outline),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: Colors.white,
      ),
    );
  }
}
