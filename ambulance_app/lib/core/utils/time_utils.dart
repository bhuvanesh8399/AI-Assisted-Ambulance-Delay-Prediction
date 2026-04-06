String formatEta(int seconds) {
  final m = seconds ~/ 60;
  final s = seconds % 60;
  final mm = m.toString().padLeft(2, '0');
  final ss = s.toString().padLeft(2, '0');
  return '$mm:$ss';
}

int secondsAgo(DateTime? ts) {
  if (ts == null) return 999999;
  final now = DateTime.now().toUtc();
  final t = ts.isUtc ? ts : ts.toUtc();
  return now.difference(t).inSeconds.abs();
}
