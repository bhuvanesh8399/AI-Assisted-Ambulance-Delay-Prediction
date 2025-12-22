// frontend/src/services/realtime.ts
// SECTION 6 ONLY: Optional websocket transport. No state rewrite.

export type RealtimeMode = "polling" | "ws";

export function makeWsUrl(path: string) {
  // Supports dev/prod (http->ws, https->wss)
  const base = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
  const u = new URL(base);
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${u.host}${path}`;
}

export function connectTripWS(
  tripId: string,
  onData: (msg: any) => void,
  onFail: () => void
) {
  const ws = new WebSocket(makeWsUrl(`/ws/trips/${tripId}`));

  ws.onmessage = (e) => {
    try {
      onData(JSON.parse(e.data));
    } catch {
      // Ignore bad frames
    }
  };

  ws.onerror = () => onFail();
  ws.onclose = () => onFail();

  const ping = window.setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
  }, 5000);

  return () => {
    window.clearInterval(ping);
    try { ws.close(); } catch {}
  };
}
