import { useState } from "react";
import clsx from "clsx";
import OwnerLayout from "../../components/owner/OwnerLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useOwnerBookings } from "../../hooks/useOwner.js";
import { formatCurrency, formatDate, nightsCount } from "../../lib/utils.js";

const STATUS = {
  PENDING_PAYMENT: { label: "Awaiting payment", badge: "pending" },
  CONFIRMED: { label: "Confirmed", badge: "confirmed" },
  CHECKED_IN: { label: "Checked in", badge: "confirmed" },
  CHECKED_OUT: { label: "Completed", badge: "confirmed" },
  CANCELLED: { label: "Cancelled", badge: "cancelled" },
};

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "awaiting", label: "Awaiting payment" },
  { key: "past", label: "Past and cancelled" },
];

function bucket(b, today) {
  if (b.status === "PENDING_PAYMENT") return "awaiting";
  const over = b.checkOut.slice(0, 10) <= today;
  if (b.status === "CANCELLED" || b.status === "CHECKED_OUT" || over) return "past";
  return "upcoming";
}

export default function BookingsListPage() {
  const { data, isLoading, isError } = useOwnerBookings();
  const [tab, setTab] = useState("upcoming");
  const today = new Date().toISOString().slice(0, 10);

  const groups = { upcoming: [], awaiting: [], past: [] };
  (data || []).forEach((b) => groups[bucket(b, today)].push(b));
  const list = groups[tab];

  return (
    <OwnerLayout title="Bookings">
      <div className="flex gap-1 mb-4 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-3 py-2 rounded-control text-body font-medium whitespace-nowrap",
              tab === t.key ? "bg-info-50 text-info-600" : "text-ink-600 hover:bg-surface-muted"
            )}
          >
            {t.label} ({groups[t.key].length})
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      )}
      {isError && <p className="text-danger-500 py-8 text-center">Could not load your bookings.</p>}

      {data && list.length === 0 && (
        <p className="text-body text-ink-600 py-10 text-center">Nothing here yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {list.map((b) => {
          const s = STATUS[b.status] || { label: b.status, badge: "" };
          const nights = nightsCount(b.checkIn.slice(0, 10), b.checkOut.slice(0, 10));
          return (
            <Card key={b.id} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-heading-md text-ink-900">{b.room.property.name}</h2>
                  <p className="text-body text-ink-600">{b.room.name}</p>
                </div>
                <Badge status={s.badge}>{s.label}</Badge>
              </div>
              <p className="text-body text-ink-600">
                {formatDate(b.checkIn)} to {formatDate(b.checkOut)} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
                <strong className="text-ink-900">{formatCurrency(b.totalAmount)}</strong>
              </p>
              <p className="text-body text-ink-900">
                {b.traveler.fullName}
                {b.traveler.phoneNumber ? (
                  <a href={`tel:+${b.traveler.phoneNumber}`} className="text-primary-600 font-medium ml-2">
                    +{b.traveler.phoneNumber}
                  </a>
                ) : (
                  <span className="text-xs text-ink-400 ml-2">Phone shown once paid</span>
                )}
              </p>
              <p className="text-xs text-ink-400">Ref {b.id.slice(0, 8).toUpperCase()}</p>
            </Card>
          );
        })}
      </div>
    </OwnerLayout>
  );
}
