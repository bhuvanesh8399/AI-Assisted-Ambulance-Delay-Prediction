import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

function NavLink({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={[
        "px-3 py-2 rounded-lg text-sm font-medium transition",
        active
          ? "bg-white/10 text-white shadow"
          : "text-zinc-300 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">AI-Assisted EMS</div>
            <div className="text-lg font-semibold tracking-tight">
              Ambulance ETA + Green Corridor
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <NavLink to="/dashboard/hospital" label="Hospital" />
            <NavLink to="/dashboard/traffic" label="Traffic" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
