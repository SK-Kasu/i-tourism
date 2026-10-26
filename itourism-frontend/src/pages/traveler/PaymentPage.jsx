import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Smartphone } from "lucide-react";
import TopNav from "../../components/layout/TopNav.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useBookingById, useInitiatePayment } from "../../hooks/useBooking.js";
import { usePaymentStatus } from "../../hooks/usePaymentStatus.js";
import { formatCurrency, formatDate } from "../../lib/utils.js";

const WAIT_MS = 90_000; // how long we wait for the PIN before giving up

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: booking, isLoading, isError } = useBookingById(bookingId);
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [waiting, setWaiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [failedMsg, setFailedMsg] = useState("");

  const initiate = useInitiatePayment();
  const { data: payment } = usePaymentStatus(bookingId, waiting);

  function goConfirmed() {
    qc.invalidateQueries({ queryKey: ["booking", bookingId] });
    navigate(`/booking/${bookingId}/confirmed`, { replace: true });
  }

  // Already paid (for example the page was refreshed after paying).
  useEffect(() => {
    if (booking?.status === "CONFIRMED") goConfirmed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.status]);

  // React to the polled payment result.
  useEffect(() => {
    if (!waiting || !payment) return;
    if (payment.status === "HELD") goConfirmed();
    if (payment.status === "FAILED") {
      setWaiting(false);
      setFailedMsg(payment.resultDesc || "The payment was not completed.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, waiting]);

  // Stop waiting after 90 seconds.
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => {
      setWaiting(false);
      setTimedOut(true);
    }, WAIT_MS);
    return () => clearTimeout(t);
  }, [waiting]);

  async function pay(e) {
    e.preventDefault();
    setFailedMsg("");
    setTimedOut(false);
    try {
      await initiate.mutateAsync({ bookingId, phoneNumber: phone });
      // Clear any old FAILED result so it isn't mistaken for this attempt.
      qc.setQueryData(["payment-status", bookingId], { status: "PENDING" });
      setWaiting(true);
    } catch {
      /* the hook already showed an error toast */
    }
  }

  const expired = booking?.status === "CANCELLED";

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-heading-lg text-ink-900 mb-4">Pay with M-Pesa</h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        )}
        {isError && <p className="text-danger-500 text-center py-12">Booking not found.</p>}

        {booking && expired && (
          <Card>
            <p className="text-body text-ink-900 font-medium">This booking has expired.</p>
            <p className="text-body text-ink-600 mt-1">
              Unpaid rooms are released after 15 minutes.{" "}
              <Link to="/" className="text-primary-600 font-medium">
                Search again
              </Link>
            </p>
          </Card>
        )}

        {booking && !expired && (
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-heading-md text-ink-900">{booking.room.property.name}</h2>
              <p className="text-body text-ink-600">
                {booking.room.name} · {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)}
              </p>
            </div>
            <p className="text-body text-ink-900">
              Amount to pay: <strong>{formatCurrency(booking.totalAmount)}</strong>
            </p>

            {waiting ? (
              <div className="flex flex-col items-center text-center gap-3 py-4" aria-live="polite">
                <Spinner size={32} />
                <Smartphone className="text-primary-500" aria-hidden="true" />
                <p className="text-body text-ink-900 font-medium">Check your phone</p>
                <p className="text-body text-ink-600">
                  Enter your M-Pesa PIN to approve the payment. This page updates by itself.
                </p>
              </div>
            ) : (
              <form onSubmit={pay} className="flex flex-col gap-3" noValidate>
                <Input
                  label="M-Pesa phone number"
                  type="tel"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {failedMsg && <p className="text-sm text-danger-500">{failedMsg} You can try again.</p>}
                {timedOut && (
                  <p className="text-sm text-warning-600">
                    We have not received your payment yet. If you already entered your PIN, wait a
                    minute and check{" "}
                    <Link to="/my-bookings" className="underline">
                      My bookings
                    </Link>
                    . Otherwise try again.
                  </p>
                )}
                <Button type="submit" disabled={initiate.isPending} className="w-full">
                  {initiate.isPending ? "Sending prompt..." : `Pay ${formatCurrency(booking.totalAmount)}`}
                </Button>
              </form>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
