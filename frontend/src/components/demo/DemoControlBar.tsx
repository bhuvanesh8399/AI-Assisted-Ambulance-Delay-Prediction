import type { FrontendLocale } from "../../i18n/frontendI18n";
import { frontendI18n } from "../../i18n/frontendI18n";
import type { LiveState } from "../../hooks/useLiveStatus";

type Props = {
  tripId: string;
  onTripIdChange: (value: string) => void;
  onLoad?: () => void;
  onLoadTrip?: () => void;
  pollingMs: number;
  onPollingChange: (value: number) => void;
  liveState: LiveState;
  lastUpdatedLabel: string;
  locale: FrontendLocale;
  onLocaleChange: (value: FrontendLocale) => void;
  loading?: boolean;
};

const pollingOptions = [2000, 3000, 5000, 10000];

export default function DemoControlBar({
  tripId,
  onTripIdChange,
  onLoad,
  onLoadTrip,
  pollingMs,
  onPollingChange,
  liveState,
  lastUpdatedLabel,
  locale,
  onLocaleChange,
  loading = false,
}: Props) {
  const t = frontendI18n[locale];
  const handleLoad = onLoad ?? onLoadTrip ?? (() => {});

  const liveTone =
    liveState === "LIVE"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
      : liveState === "STALE"
        ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
        : "border-red-400/30 bg-red-500/15 text-red-200";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-4 md:grid-cols-3 xl:flex xl:flex-wrap xl:items-end">
          <div className="min-w-[220px]">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/55">
              {t.tripId}
            </label>
            <input
              value={tripId}
              onChange={(e) => onTripIdChange(e.target.value)}
              placeholder={t.tripIdPlaceholder}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/50"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/55">
              {t.polling}
            </label>
            <select
              value={pollingMs}
              onChange={(e) => onPollingChange(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              {pollingOptions.map((ms) => (
                <option key={ms} value={ms}>
                  {ms / 1000}s
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleLoad}
              disabled={!tripId.trim() || loading}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : t.load}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] ${liveTone}`}>
            {liveState === "LIVE" ? t.live : liveState === "STALE" ? t.stale : t.offline}
          </span>

          <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
            {t.pilotDemo}
          </span>

          <span className="text-sm text-white/65">{lastUpdatedLabel}</span>

          <div className="flex overflow-hidden rounded-2xl border border-white/10">
            <button
              onClick={() => onLocaleChange("en")}
              className={`px-3 py-2 text-sm ${locale === "en" ? "bg-white text-black" : "bg-white/5 text-white/75"}`}
            >
              {t.english}
            </button>
            <button
              onClick={() => onLocaleChange("ta")}
              className={`px-3 py-2 text-sm ${locale === "ta" ? "bg-white text-black" : "bg-white/5 text-white/75"}`}
            >
              {t.tamil}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
