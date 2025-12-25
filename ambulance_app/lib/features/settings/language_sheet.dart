import 'package:flutter/material.dart';
import 'package:ambulance_app/core/i18n/app_localizations.dart';

class LanguageSheet extends StatelessWidget {
  const LanguageSheet({super.key, required this.onSelect});

  final ValueChanged<Locale> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context)!;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              t.language,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text('English'),
              onTap: () {
                onSelect(const Locale('en'));
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.language),
              title: const Text('தமிழ்'),
              onTap: () {
                onSelect(const Locale('ta'));
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
