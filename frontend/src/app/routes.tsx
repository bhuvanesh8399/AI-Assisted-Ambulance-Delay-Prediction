import HospitalDashboardPage from "../pages/dashboards/hospital/HospitalDashboardPage";
import TrafficDashboardPage from "../pages/dashboards/traffic/TrafficDashboardPage";

export const routes = [
  { path: "/dashboard/hospital", element: <HospitalDashboardPage /> },
  { path: "/dashboard/traffic", element: <TrafficDashboardPage /> },
];
