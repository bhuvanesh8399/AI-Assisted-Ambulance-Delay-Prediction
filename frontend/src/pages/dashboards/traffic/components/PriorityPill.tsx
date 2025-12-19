import type { Priority } from "../../../../services/dashboard/types";

const COLOR_MAP: Record<Priority, string> = {
  high: "bg-red-600 text-white",
  medium: "bg-yellow-400 text-black",
  low: "bg-green-600 text-white",
};

type Props = {
  priority: Priority;
};

export function PriorityPill({ priority }: Props) {
  return <span className={`px-3 py-1 rounded ${COLOR_MAP[priority]}`}>{priority.toUpperCase()}</span>;
}
