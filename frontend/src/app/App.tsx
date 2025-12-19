import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routes } from "./routes";
import AppShell from "../components/layout/AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/hospital" replace />} />
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
