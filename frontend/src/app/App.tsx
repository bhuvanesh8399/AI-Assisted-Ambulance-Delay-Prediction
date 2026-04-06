import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routes } from "./routes";
import { EmergencyBackground } from "../components/layout/EmergencyBackground";
import "../styles/emergency-theme.css";

export default function App() {
  return (
    <div className="emergency-app">
      <EmergencyBackground />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/hospital" replace />} />
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </BrowserRouter>
    </div>
  );
}
