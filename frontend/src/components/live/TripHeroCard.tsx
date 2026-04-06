import type { TripSnapshot } from "../../services/tripLiveService";

function formatEta(seconds: number): string {
  const mins = Math.max(0, Math.round(seconds / 60));
  return `${mins} min`;
}

export default function TripHeroCard({ snapshot }: { snapshot: TripSnapshot }) {
  return (
    <section className="glass-card section-card">
      <div className="hero-card__eyebrow">
        <span className="hero-card__pulse" />
        <span>Live ambulance ETA</span>
      </div>
      <div className="hero-card__main">
        <div className="hero-card__trip">
          <h2>{snapshot.destination_hospital_name ?? "Destination hospital"}</h2>
          <p>{snapshot.ambulance_label} • {snapshot.trip_id} • {snapshot.status}</p>
        </div>
        <div className="hero-card__eta">
          <div className="metric-label">Final ETA</div>
          <div className="hero-card__eta-value">{formatEta(snapshot.eta_final_seconds)}</div>
          <div className="meta-copy">Baseline {formatEta(snapshot.eta_osrm_seconds)} + delay {formatEta(snapshot.predicted_delay_seconds)}</div>
        </div>
      </div>
    </section>
  );
}
