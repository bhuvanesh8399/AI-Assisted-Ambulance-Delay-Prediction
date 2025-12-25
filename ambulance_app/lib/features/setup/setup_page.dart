import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ambulance_app/core/i18n/app_localizations.dart';

import '../../core/config/api_config.dart';
import '../../core/widgets/primary_button.dart';
import '../settings/language_sheet.dart';

class SetupPage extends StatefulWidget {
  const SetupPage({
    super.key,
    required this.config,
    required this.onChangeLocale,
  });

  final ApiConfig config;
  final ValueChanged<Locale> onChangeLocale;

  @override
  State<SetupPage> createState() => _SetupPageState();
}

class _SetupPageState extends State<SetupPage> {
  late final TextEditingController _ambulanceId;
  late final TextEditingController _baseUrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _ambulanceId = TextEditingController(text: widget.config.getAmbulanceId());
    _baseUrl = TextEditingController(text: widget.config.getBaseUrl());
  }

  @override
  void dispose() {
    _ambulanceId.dispose();
    _baseUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final id = _ambulanceId.text.trim();
    final url = _baseUrl.text.trim();

    if (id.isEmpty || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.fillAllFields)),
      );
      return;
    }

    setState(() => _saving = true);
    await widget.config.setAmbulanceId(id);
    await widget.config.setBaseUrl(url);
    setState(() => _saving = false);

    if (!mounted) return;
    context.go('/trip/start');
  }

  void _openLanguage() {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (_) => LanguageSheet(onSelect: widget.onChangeLocale),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(t.setupTitle),
        actions: [
          IconButton(
            onPressed: _openLanguage,
            icon: const Icon(Icons.translate),
            tooltip: t.language,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    t.setupHint,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _ambulanceId,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: t.ambulanceId,
                      prefixIcon: const Icon(Icons.badge_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _baseUrl,
                    keyboardType: TextInputType.url,
                    decoration: InputDecoration(
                      labelText: t.backendBaseUrl,
                      prefixIcon: const Icon(Icons.cloud_rounded),
                      helperText: t.backendHint,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          PrimaryButton(
            label: _saving ? t.saving : t.saveAndContinue,
            icon: Icons.save_rounded,
            onPressed: _saving ? null : _save,
          ),
        ],
      ),
    );
  }
}
