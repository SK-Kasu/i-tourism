import { Link, useNavigate } from "react-router-dom";
import TopNav from "../../components/layout/TopNav.jsx";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useMyBookings, useCancelBooking } from "../../hooks/useBooking.js";
import { formatCurrency, formatDate } from "../../lib/utils.js";

const STATUS = {
  PENDING_PAYMENT: { label: "Awaiting payment", badge: "pending" },
  CONFIRMED: { label: "Confirmed", badge: "confirmed" },
  CHECKED_IN: { label: "Checked in", badge: "confirmed" },
  CHECKED_OUT: { label: "Completed", badge: "confirmed" },
  CANCELLED: { label: "Cancelled", badge: "cancelled" },
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMyBookings();
  const cancel = useCancelBooking();

  function onCancel(id) {
    if (window.confirm("Cancel this booking?")) cancel.mutate(id);
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-heading-lg text-ink-900 mb-4">My bookings</h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        )}
        {isError && <p className="text-danger-500 text-center py-12">Could not load your bookings.</p>}

        {data && data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-heading-md text-ink-900">No bookings yet</p>
            <p className="text-body text-ink-600 mt-1">
              <Link to="/" className="text-primary-600 font-medium">
                Find a stay
              </Link>{" "}
              to get started.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {data?.map((b) => {
            const s = STATUS[b.status] || { label: b.status, badge: "" };
            return (
              <Card key={b.id} className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-heading-md text-ink-900">{b.room.property.name}</h2>
                    <p className="text-body text-ink-600">{b.room.name}</p>
                  </div>
                  <Badge status={s.badge}>{s.label}</Badge>
                </div>
                <p className="text-body text-ink-600">
                  {formatDate(b.checkIn)} to {formatDate(b.checkOut)} ·{" "}
                  <strong className="text-ink-900">{formatCurrency(b.totalAmount)}</strong>
                </p>
                <p className="text-xs text-ink-400">Ref {b.id.slice(0, 8).toUpperCase()}</p>

                {b.status === "PENDING_PAYMENT" && (
                  <div className="flex gap-2 mt-1">
                    <Button variant="ghost" onClick={() => navigate(`/pay/${b.id}`)}>
                      Pay now
                    </Button>
                    <Button variant="secondary" onClick={() => onCancel(b.id)} disabled={cancel.isPending}>
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
