export default function LivePill({ lastUpdated }: { lastUpdated?: string }) {
  const t = lastUpdated ? new Date(lastUpdated).getTime() : 0;
  const ageSec = t ? Math.floor((Date.now() - t) / 1000) : 9999;

  const live = ageSec <= 10;
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        live
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-100",
      ].join(" ")}
      title={lastUpdated ? `Updated ${ageSec}s ago` : "No update time"}
    >
      <span className={["h-2 w-2 rounded-full", live ? "bg-emerald-400" : "bg-yellow-400"].join(" ")} />
      {live ? "LIVE" : `STALE (${ageSec}s)`}
    </span>
  );
}
