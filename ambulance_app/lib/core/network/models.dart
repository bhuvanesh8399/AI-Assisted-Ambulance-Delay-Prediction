class TripStartResponse {
  final String tripId;
  final String? startedAt;

  TripStartResponse({required this.tripId, this.startedAt});

  factory TripStartResponse.fromJson(Map<String, dynamic> json) {
    // STRICT: only read known fields. If backend differs, update here.
    return TripStartResponse(
      tripId: (json['trip_id'] ?? '').toString(),
      startedAt: json['started_at']?.toString(),
    );
  }
}

/// Snapshot is treated as "truth source" and kept flexible.
/// We map only what we need; everything else is ignored.
class TripSnapshot {
  final String tripId;
  final String? status; // EN_ROUTE / NEAR_ARRIVAL / ARRIVED
  final String? risk;   // LOW/MED/HIGH
  final int? etaSeconds; // final ETA seconds (or null)
  final DateTime? lastUpdate; // timestamp from backend

  TripSnapshot({
    required this.tripId,
    this.status,
    this.risk,
    this.etaSeconds,
    this.lastUpdate,
  });

  factory TripSnapshot.fromJson(Map<String, dynamic> json) {
    final tripId = json['trip_id']?.toString() ?? '';
    final status = json['status']?.toString();
    final risk = (json['risk'] ?? json['risk_level'])?.toString();

    int? etaSeconds;
    final etaAny =
        json['eta_final_seconds'] ??
        json['final_eta_seconds'] ??
        json['eta_seconds'] ??
        json['eta_sec'];
    if (etaAny is int) etaSeconds = etaAny;
    if (etaAny is double) etaSeconds = etaAny.toInt();
    if (etaAny is String) etaSeconds = int.tryParse(etaAny);

    DateTime? lastUpdate;
    final ts =
        json['last_update_at'] ??
        json['last_update'] ??
        json['updated_at'] ??
        json['timestamp'];
    if (ts != null) {
      lastUpdate = DateTime.tryParse(ts.toString());
    }

    return TripSnapshot(
      tripId: tripId,
      status: status,
      risk: risk,
      etaSeconds: etaSeconds,
      lastUpdate: lastUpdate,
    );
  }
}
