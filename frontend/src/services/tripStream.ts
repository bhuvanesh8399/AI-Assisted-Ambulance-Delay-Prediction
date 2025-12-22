export type TripStreamMode = "polling" | "ws";

export type TripSnapshot = any;
// NOTE: keep this as `any` or import your existing Snapshot type.
// DO NOT invent new fields; payload must match /snapshot exactly.

type TripStreamHandlers = {
  onMessage: (snap: TripSnapshot) => void;
  onError: (err: unknown) => void;
  onClose: () => void;
};

export function connectTripWebSocket(tripId: string, handlers: TripStreamHandlers) {
  // Assumes same origin. If backend is separate, adjust base URL safely.
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${proto}://${window.location.host}/ws/trip/${tripId}`;

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      handlers.onMessage(data);
    } catch (e) {
      handlers.onError(e);
    }
  };

  ws.onerror = (e) => handlers.onError(e);
  ws.onclose = () => handlers.onClose();

  return () => {
    try {
      ws.close();
    } catch {
      /* noop */
    }
  };
}
