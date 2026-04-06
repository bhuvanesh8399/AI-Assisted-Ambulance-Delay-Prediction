import { useMemo, useState } from "react";
import DemoControlBar from "./DemoControlBar";
import LiveStateBanner from "./LiveStateBanner";
import { useFrontendLocale } from "../../hooks/useFrontendLocale";
import { useLiveStatus } from "../../hooks/useLiveStatus";
import { frontendI18n, type FrontendLocale } from "../../i18n/frontendI18n";

type Props = {
  initialTripId?: string;
  lastUpdatedAt?: string | number | Date | null;
  defaultPollingMs?: number;
  pollingMs?: number;
  onPollingChange?: (value: number) => void;
  locale?: FrontendLocale;
  onLocaleChange?: (value: FrontendLocale) => void;
  loading?: boolean;
  onLoadTrip?: (tripId: string) => void;
  liveMessage?: string;
  delayedMessage?: string;
};

export default function DemoControlBarHost({
  initialTripId = "",
  lastUpdatedAt,
  defaultPollingMs = 3000,
  pollingMs: controlledPollingMs,
  onPollingChange,
  locale: controlledLocale,
  onLocaleChange,
  loading = false,
  onLoadTrip,
  liveMessage,
  delayedMessage,
}: Props) {
  const [tripId, setTripId] = useState(initialTripId);
  const [uncontrolledPollingMs, setUncontrolledPollingMs] = useState(defaultPollingMs);
  const localeState = useFrontendLocale();

  const locale = controlledLocale ?? localeState.locale;
  const setLocale = onLocaleChange ?? localeState.setLocale;
  const pollingMs = controlledPollingMs ?? uncontrolledPollingMs;
  const setPollingMs = onPollingChange ?? setUncontrolledPollingMs;

  const t = frontendI18n[locale];

  const { liveState, ageMs } = useLiveStatus({
    lastUpdatedAt,
    staleAfterMs: pollingMs * 2,
    offlineAfterMs: pollingMs * 6,
  });

  const lastUpdatedLabel = useMemo(() => {
    if (ageMs == null) {
      return t.waitingForFeed;
    }
    return `${t.lastUpdated}: ${Math.floor(ageMs / 1000)}${t.secondsAgo}`;
  }, [ageMs, t]);

  const bannerMessage =
    liveState === "LIVE"
      ? liveMessage ?? lastUpdatedLabel
      : delayedMessage ?? t.usePhoneBackup;

  return (
    <div className="space-y-4">
      <DemoControlBar
        tripId={tripId}
        onTripIdChange={setTripId}
        onLoad={() => onLoadTrip?.(tripId)}
        pollingMs={pollingMs}
        onPollingChange={setPollingMs}
        liveState={liveState}
        lastUpdatedLabel={lastUpdatedLabel}
        locale={locale}
        onLocaleChange={setLocale}
        loading={loading}
      />

      <LiveStateBanner
        liveState={liveState}
        message={bannerMessage}
      />
    </div>
  );
}
