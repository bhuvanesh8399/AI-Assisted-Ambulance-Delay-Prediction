import type { Risk } from "../../../../services/dashboard/types";

const COLOR_MAP: Record<Risk, string> = {
  high: "bg-red-600 text-white",
  medium: "bg-yellow-400 text-black",
  low: "bg-green-600 text-white",
};

type Props = {
  risk: Risk;
};

export function RiskBadge({ risk }: Props) {
  return <span className={`inline-block px-3 py-1 rounded ${COLOR_MAP[risk]}`}>{risk.toUpperCase()}</span>;
}
