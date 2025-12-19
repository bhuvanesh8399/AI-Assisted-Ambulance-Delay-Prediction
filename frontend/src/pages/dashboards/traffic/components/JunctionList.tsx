import type { JunctionWindow } from "../../../../services/dashboard/types";
import { PriorityPill } from "./PriorityPill";

type Props = {
  junctions: JunctionWindow[];
};

export function JunctionList({ junctions }: Props) {
  if (!junctions.length) {
    return <div className="text-gray-500">No corridor plan yet (planner not wired / demo mode).</div>;
  }

  return (
    <div className="space-y-2">
      {junctions.map((j, idx) => (
        <div key={idx} className="flex items-center justify-between border rounded p-3">
          <div>
            <div className="font-medium">{j.name}</div>
            <div className="text-xs text-gray-500">
              Window: {new Date(j.window_start).toLocaleTimeString()} – {new Date(j.window_end).toLocaleTimeString()}
            </div>
          </div>
          <PriorityPill priority={j.priority} />
        </div>
      ))}
    </div>
  );
}
