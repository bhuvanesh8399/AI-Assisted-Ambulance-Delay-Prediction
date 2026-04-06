import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

type Props = PropsWithChildren<{
  title: string;
  eyebrow: string;
  liveState: "live" | "stale" | "offline";
  locale: "en" | "ta";
  onLocaleChange: (locale: "en" | "ta") => void;
}>;

export default function AppShell({
  title,
  eyebrow,
  liveState,
  locale,
  onLocaleChange,
  children,
}: Props) {
  const liveStateColor =
    liveState === "live" ? "#10b981" : liveState === "stale" ? "#f59e0b" : "#ef4444";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar__eyebrow">AI-Assisted Ambulance Ops</div>
          <div className="sidebar__title">Emergency Command Dashboard</div>
          <div className="sidebar__subtitle">
            Delay prediction, hospital readiness, and corridor coordination in one live control surface.
          </div>
        </div>

        <nav className="sidebar__nav">
          <NavLink
            to="/dashboard/hospital"
            className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
          >
            <span className="nav-link__icon" />
            <span>Hospital Dashboard</span>
          </NavLink>
          <NavLink
            to="/dashboard/traffic"
            className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
          >
            <span className="nav-link__icon" />
            <span>Traffic Dashboard</span>
          </NavLink>
        </nav>

        <div className="command-card">
          <h4>Operator Notes</h4>
          <p>Polling stays as the safe default. WebSocket remains optional. Phone coordination is still the fallback.</p>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div className="topbar__title">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
          </div>

          <div className="topbar__actions">
            <div className="pill" style={{ color: liveStateColor }}>
              <span className="pill__dot" />
              <span>{liveState.toUpperCase()}</span>
            </div>

            <div className="lang-toggle">
              <button type="button" className={locale === "en" ? "active" : ""} onClick={() => onLocaleChange("en")}>
                EN
              </button>
              <button type="button" className={locale === "ta" ? "active" : ""} onClick={() => onLocaleChange("ta")}>
                TA
              </button>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
