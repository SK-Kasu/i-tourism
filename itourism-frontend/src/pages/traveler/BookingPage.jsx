import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import TopNav from "../../components/layout/TopNav.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useRoom, useCreateBooking } from "../../hooks/useBooking.js";
import { formatCurrency, formatDate, nightsCount } from "../../lib/utils.js";

export default function BookingPage() {
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const nights = nightsCount(checkIn, checkOut);

  const { data: room, isLoading, isError } = useRoom(roomId);
  const create = useCreateBooking();

  function confirm() {
    create.mutate(
      { roomId, checkIn, checkOut },
      { onSuccess: (booking) => navigate(`/pay/${booking.id}`) }
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-heading-lg text-ink-900 mb-4">Review your booking</h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        )}
        {isError && <p className="text-danger-500 text-center py-12">Room not found.</p>}

        {room && !nights && (
          <Card>
            <p className="text-body text-ink-600">Please choose your dates first.</p>
            <Link to={`/property/${room.property.id}`} className="text-primary-600 font-medium">
              Back to {room.property.name}
            </Link>
          </Card>
        )}

        {room && nights > 0 && (
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="text-heading-md text-ink-900">{room.property.name}</h2>
              <p className="text-body text-ink-600">
                {room.name} · {room.property.county}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-y-2 text-body">
              <dt className="text-ink-600">Check-in</dt>
              <dd className="text-right text-ink-900">{formatDate(checkIn)}</dd>
              <dt className="text-ink-600">Check-out</dt>
              <dd className="text-right text-ink-900">{formatDate(checkOut)}</dd>
              <dt className="text-ink-600">
                {formatCurrency(room.pricePerNight)} × {nights} night{nights === 1 ? "" : "s"}
              </dt>
              <dd className="text-right text-ink-900">
                {formatCurrency(Number(room.pricePerNight) * nights)}
              </dd>
              <dt className="text-ink-900 font-medium border-t border-surface-border pt-2">Total</dt>
              <dd className="text-right text-ink-900 font-bold border-t border-surface-border pt-2">
                {formatCurrency(Number(room.pricePerNight) * nights)}
              </dd>
            </dl>

            <p className="text-xs text-ink-600">
              We hold the room for 15 minutes while you pay. You pay by M-Pesa on the next screen.
            </p>

            <Button onClick={confirm} disabled={create.isPending} className="w-full">
              {create.isPending ? "Reserving..." : "Continue to payment"}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
