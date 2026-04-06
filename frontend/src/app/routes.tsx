import HospitalDashboardPage from "../pages/dashboards/hospital/HospitalDashboardPage";
import TrafficDashboardPage from "../pages/dashboards/traffic/TrafficDashboardPage";

export const routes = [
  { path: "/hospital", element: <HospitalDashboardPage /> },
  { path: "/traffic", element: <TrafficDashboardPage /> },
  { path: "/dashboard/hospital", element: <HospitalDashboardPage /> },
  { path: "/dashboard/traffic", element: <TrafficDashboardPage /> },
];
