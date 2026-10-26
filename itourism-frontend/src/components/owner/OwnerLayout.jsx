import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { LayoutDashboard, PlusSquare, CalendarDays, ClipboardList, Wallet } from "lucide-react";
import TopNav from "../layout/TopNav.jsx";

const LINKS = [
  { to: "/owner/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/owner/listings/new", label: "Add listing", Icon: PlusSquare },
  { to: "/owner/availability", label: "Availability", Icon: CalendarDays },
  { to: "/owner/bookings", label: "Bookings", Icon: ClipboardList },
  { to: "/owner/payouts", label: "Payouts", Icon: Wallet },
];

// Sidebar on large screens (like the mockup), scrollable tab row on phones.
export default function OwnerLayout({ title, action, children }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="max-w-6xl mx-auto px-4 py-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-6">
        <nav className="flex gap-1 overflow-x-auto mb-4 lg:mb-0 lg:flex-col lg:overflow-visible" aria-label="Owner menu">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-control text-body font-medium whitespace-nowrap",
                  isActive ? "bg-info-50 text-info-600" : "text-ink-600 hover:bg-surface-muted"
                )
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-heading-lg text-ink-900">{title}</h1>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
