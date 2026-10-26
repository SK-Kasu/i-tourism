import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Users } from "lucide-react";
import TopNav from "../../components/layout/TopNav.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useProperty } from "../../hooks/useSearch.js";
import { formatCurrency } from "../../lib/utils.js";

const today = () => new Date().toISOString().slice(0, 10);

function nightsCount(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const nights = nightsCount(checkIn, checkOut);

  const { data: property, isLoading, isError } = useProperty(id);

  function setDate(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  }

  function book(roomId) {
    if (!nights) return toast.error("Choose your check-in and check-out dates first");
    navigate(`/book/${roomId}?checkIn=${checkIn}&checkOut=${checkOut}`);
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size={32} />
          </div>
        )}
        {isError && <p className="text-danger-500 text-center py-12">Property not found.</p>}

        {property && (
          <>
            <h1 className="text-heading-lg text-ink-900">{property.name}</h1>
            <p className="flex items-center gap-1 text-body text-ink-600 mt-1">
              <MapPin size={14} aria-hidden="true" />
              {property.county}, {property.region}
            </p>

            {property.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {property.photos.slice(0, 4).map((ph) => (
                  <img key={ph.id} src={ph.url} alt="" loading="lazy" className="rounded-card h-40 w-full object-cover" />
                ))}
              </div>
            )}

            <Card className="mt-6 grid gap-3 sm:grid-cols-2">
              <Input label="Check-in" type="date" min={today()} value={checkIn} onChange={(e) => setDate("checkIn", e.target.value)} />
              <Input label="Check-out" type="date" min={checkIn || today()} value={checkOut} onChange={(e) => setDate("checkOut", e.target.value)} />
            </Card>

            <h2 className="text-heading-md text-ink-900 mt-6 mb-3">Rooms</h2>
            <div className="flex flex-col gap-3">
              {property.rooms.map((room) => {
                const price = Number(room.pricePerNight);
                return (
                  <Card key={room.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                      <h3 className="text-body font-medium text-ink-900">{room.name}</h3>
                      <p className="flex items-center gap-1 text-xs text-ink-600 mt-0.5">
                        <Users size={12} aria-hidden="true" /> Up to {room.maxOccupancy} guest{room.maxOccupancy === 1 ? "" : "s"}
                      </p>
                      {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                        <p className="text-xs text-ink-600 mt-1">{room.amenities.join(" · ")}</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-body text-ink-900">
                        <strong>{formatCurrency(price)}</strong>
                        <span className="text-xs text-ink-600"> /night</span>
                      </p>
                      {nights > 0 && (
                        <p className="text-xs text-ink-600">
                          {nights} night{nights === 1 ? "" : "s"}: {formatCurrency(price * nights)}
                        </p>
                      )}
                      <Button className="mt-2 w-full sm:w-auto" onClick={() => book(room.id)}>
                        Book now
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
