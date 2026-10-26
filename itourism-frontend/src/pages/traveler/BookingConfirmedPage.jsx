import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import TopNav from "../../components/layout/TopNav.jsx";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useBookingById } from "../../hooks/useBooking.js";
import { formatCurrency, formatDate } from "../../lib/utils.js";

export default function BookingConfirmedPage() {
  const { bookingId } = useParams();
  const { data: b, isLoading, isError } = useBookingById(bookingId);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        )}
        {isError && <p className="text-danger-500 text-center py-12">Booking not found.</p>}

        {b && b.status !== "CONFIRMED" && (
          <Card>
            <p className="text-body text-ink-900 font-medium">We are still confirming this booking.</p>
            <p className="text-body text-ink-600 mt-1">
              Check{" "}
              <Link to="/my-bookings" className="text-primary-600 font-medium">
                My bookings
              </Link>{" "}
              in a moment.
            </p>
          </Card>
        )}

        {b && b.status === "CONFIRMED" && (
          <>
            <div className="flex flex-col items-center text-center mb-4">
              <CheckCircle2 size={48} className="text-success-500" aria-hidden="true" />
              <h1 className="text-heading-lg text-ink-900 mt-2">Booking confirmed</h1>
              <p className="text-body text-ink-600">
                Reference <strong>{b.id.slice(0, 8).toUpperCase()}</strong>
              </p>
            </div>

            <Card className="flex flex-col gap-3">
              <div>
                <h2 className="text-heading-md text-ink-900">{b.room.property.name}</h2>
                <p className="text-body text-ink-600">
                  {b.room.name} · {b.room.property.county}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-y-2 text-body">
                <dt className="text-ink-600">Check-in</dt>
                <dd className="text-right text-ink-900">{formatDate(b.checkIn)}</dd>
                <dt className="text-ink-600">Check-out</dt>
                <dd className="text-right text-ink-900">{formatDate(b.checkOut)}</dd>
                <dt className="text-ink-600">Paid</dt>
                <dd className="text-right text-ink-900">{formatCurrency(b.totalAmount)}</dd>
                {b.payment?.mpesaReceipt && (
                  <>
                    <dt className="text-ink-600">M-Pesa receipt</dt>
                    <dd className="text-right text-ink-900">{b.payment.mpesaReceipt}</dd>
                  </>
                )}
              </dl>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Link
                to="/my-bookings"
                className="flex-1 text-center bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-control px-5 py-2.5 transition-colors"
              >
                View my bookings
              </Link>
              <Link
                to="/"
                className="flex-1 text-center border border-surface-border text-ink-600 hover:bg-surface-muted font-medium rounded-control px-5 py-2.5 transition-colors"
              >
                Back to search
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
