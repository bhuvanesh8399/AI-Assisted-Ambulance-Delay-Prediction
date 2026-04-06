class AppConstants {
  static const gpsIntervalSeconds = 3; // configurable 2–5s
  static const snapshotPollSeconds = 2; // configurable 2–3s
  static const liveThresholdSeconds = 10; // LIVE if last update <= 10s
  static const gpsBufferMax = 30; // buffer last N GPS updates
}
