import { useLiveStatus } from "../../hooks/useLiveStatus";

type Props = {
  lastUpdateAt: string | null;
  tripId?: string | null;
};

export default function LiveStatusBanner({ lastUpdateAt, tripId }: Props) {
  const { liveState, ageMs } = useLiveStatus({ lastUpdatedAt: lastUpdateAt });
  const secondsAgo = ageMs == null ? null : Math.floor(ageMs / 1000);

  const tone =
    liveState === "LIVE"
      ? "live-banner__status live-banner__status--live"
      : liveState === "STALE"
        ? "live-banner__status live-banner__status--stale"
        : "live-banner__status live-banner__status--offline";

  return (
    <section className="glass-card live-banner">
      <div className="live-banner__left">
        <div className={tone}>{liveState}</div>
        <div className="live-banner__meta">
          <span>Last update: {secondsAgo == null ? "N/A" : `${secondsAgo}s ago`}</span>
          {tripId ? <span>{tripId}</span> : null}
        </div>
      </div>
    </section>
  );
}
