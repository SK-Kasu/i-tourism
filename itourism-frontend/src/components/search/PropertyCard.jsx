import { Link } from "react-router-dom";
import { MapPin, BedDouble } from "lucide-react";
import { formatCurrency } from "../../lib/utils.js";

export default function PropertyCard({ property, checkIn, checkOut }) {
  const prices = property.rooms.map((r) => Number(r.pricePerNight));
  const from = prices.length ? Math.min(...prices) : null;
  const photo = property.photos?.[0]?.url;

  const qs = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : "";

  return (
    <Link
      to={`/property/${property.id}${qs}`}
      className="block bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow
        border border-surface-border overflow-hidden"
    >
      {photo ? (
        <img src={photo} alt={property.name} loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-primary-50 flex items-center justify-center text-primary-500">
          <BedDouble size={36} aria-hidden="true" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-heading-md text-ink-900">{property.name}</h3>
        <p className="flex items-center gap-1 text-body text-ink-600 mt-1">
          <MapPin size={14} aria-hidden="true" />
          {property.county}, {property.region}
        </p>
        <div className="flex items-end justify-between mt-3">
          <span className="text-xs text-ink-600">
            {property.rooms.length} room type{property.rooms.length === 1 ? "" : "s"} available
          </span>
          {from !== null && (
            <span className="text-body text-ink-900">
              from <strong>{formatCurrency(from)}</strong>
              <span className="text-xs text-ink-600"> /night</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
