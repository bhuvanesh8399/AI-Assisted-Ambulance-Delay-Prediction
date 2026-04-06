import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:ambulance_app/core/i18n/app_localizations.dart';

import '../../core/config/api_config.dart';
import '../../core/utils/ui_utils.dart';
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
  final TextEditingController _ambulanceId = TextEditingController();
  final TextEditingController _baseUrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _ambulanceId.text = widget.config.getAmbulanceId();
    _baseUrl.text = widget.config.getBaseUrl();
  }

  @override
  void dispose() {
    _ambulanceId.dispose();
    _baseUrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final t = AppLocalizations.of(context);
    final id = _ambulanceId.text.trim();
    final url = _baseUrl.text.trim();

    if (id.isEmpty || url.isEmpty) {
      showSnack(context, t?.fillAllFields ?? 'Please fill all fields');
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
    final t = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(t?.setupTitle ?? 'Setup'),
        actions: [
          IconButton(
            onPressed: _openLanguage,
            icon: const Icon(Icons.translate),
            tooltip: t?.language ?? 'Language',
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
                    t?.setupHint ?? 'Enter ambulance ID and backend URL.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _ambulanceId,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: t?.ambulanceId ?? 'Ambulance ID',
                      prefixIcon: const Icon(Icons.badge_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _baseUrl,
                    keyboardType: TextInputType.url,
                    decoration: InputDecoration(
                      labelText: t?.backendBaseUrl ?? 'Backend Base URL',
                      prefixIcon: const Icon(Icons.cloud_rounded),
                      helperText: t?.backendHint ?? 'Example: http://127.0.0.1:8000',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 56,
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.save_rounded),
              label: Text(_saving ? (t?.saving ?? 'Saving...') : (t?.saveAndContinue ?? 'Save & Continue')),
            ),
          ),
        ],
      ),
    );
  }
}
