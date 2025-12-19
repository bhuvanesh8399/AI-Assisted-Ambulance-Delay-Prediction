import { formatCountdown } from "../../../../utils/time";

type Props = {
  countdownSec: number;
};

export function CountdownCard({ countdownSec }: Props) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-gray-500">Arrival Countdown</div>
      <div className="text-4xl font-bold mt-1">{formatCountdown(countdownSec)}</div>
    </div>
  );
}
