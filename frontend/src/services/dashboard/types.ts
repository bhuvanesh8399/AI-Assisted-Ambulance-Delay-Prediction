export type Risk = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";

export type HospitalDashboardResponse = {
  trip_id: string;
  eta_final_sec: number;
  eta_baseline_sec?: number | null;
  delay_pred_sec?: number | null;
  delay_risk: Risk;
  countdown_sec: number;
  prep_suggestion: string;
  last_updated: string;
};

export type JunctionWindow = {
  name: string;
  lat: number;
  lon: number;
  priority: Priority;
  window_start: string;
  window_end: string;
};

export type TrafficDashboardResponse = {
  trip_id: string;
  eta_final_sec: number;
  delay_risk: Risk;
  junctions: JunctionWindow[];
  last_updated: string;
};
