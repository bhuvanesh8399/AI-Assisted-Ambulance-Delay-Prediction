import type { LiveState } from "../../hooks/useLiveStatus";

type Props = {
  liveState: LiveState;
  message: string;
};

export default function LiveStateBanner({ liveState, message }: Props) {
  const tone =
    liveState === "LIVE"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : liveState === "STALE"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : "border-red-400/30 bg-red-500/10 text-red-200";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tone}`}>
      <span className="font-semibold tracking-wide">{liveState}</span>
      <span className="ml-2 opacity-90">{message}</span>
    </div>
  );
}
