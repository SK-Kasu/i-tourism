import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import OwnerLayout from "../../components/owner/OwnerLayout.jsx";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import { useMyProperties, useOwnerBookings, useUpdateRoom } from "../../hooks/useOwner.js";
import { formatCurrency } from "../../lib/utils.js";

function Tile({ label, value }) {
  return (
    <Card>
      <p className="text-label-sm text-ink-600 uppercase">{label}</p>
      <p className="text-heading-lg text-ink-900 mt-1">{value}</p>
    </Card>
  );
}

// One room line with an inline price editor.
function RoomRow({ room }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(Math.round(Number(room.pricePerNight))));
  const update = useUpdateRoom();
  const navigate = useNavigate();

  function save() {
    update.mutate(
      { roomId: room.id, pricePerNight: Number(price) },
      {
        onSuccess: () => {
          toast.success("Price updated");
          setEditing(false);
        },
      }
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 border-t border-surface-border first:border-t-0">
      <div>
        <p className="text-body text-ink-900">{room.name}</p>
        <p className="text-xs text-ink-600">Up to {room.maxOccupancy} guest{room.maxOccupancy === 1 ? "" : "s"}</p>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-label={`Price per night for ${room.name}`}
              className="w-28 border border-surface-border rounded-control px-2 py-1 text-body"
            />
            <Button variant="ghost" onClick={save} disabled={update.isPending} className="!px-3 !py-1.5">
              Save
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} className="!px-3 !py-1.5">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <span className="text-body text-ink-900">{formatCurrency(room.pricePerNight)}</span>
            <Button variant="secondary" onClick={() => setEditing(true)} className="!px-3 !py-1.5">
              Edit price
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/owner/availability?roomId=${room.id}`)} className="!px-3 !py-1.5">
              Calendar
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export default function OwnerDashboardPage() {
  const navigate = useNavigate();
  const { data: properties, isLoading, isError } = useMyProperties();
  const { data: bookings } = useOwnerBookings();

  const today = new Date().toISOString().slice(0, 10);
  const roomCount = (properties || []).reduce((n, p) => n + p.rooms.length, 0);
  const upcoming = (bookings || []).filter(
    (b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status) && b.checkOut.slice(0, 10) > today
  ).length;
  const awaiting = (bookings || []).filter((b) => b.status === "PENDING_PAYMENT").length;

  return (
    <OwnerLayout
      title="Dashboard"
      action={<Button onClick={() => navigate("/owner/listings/new")}>Add listing</Button>}
    >
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      )}
      {isError && <p className="text-danger-500 py-8 text-center">Could not load your listings.</p>}

      {properties && (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Tile label="Properties" value={properties.length} />
            <Tile label="Room types" value={roomCount} />
            <Tile label="Upcoming stays" value={upcoming} />
            <Tile label="Awaiting payment" value={awaiting} />
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-heading-md text-ink-900">No listings yet</p>
              <p className="text-body text-ink-600 mt-1">
                Add your first property so travelers can find and book it.{" "}
                <Link to="/owner/listings/new" className="text-primary-600 font-medium">
                  Start here
                </Link>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-4">
            {properties.map((p) => (
              <Card key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-heading-md text-ink-900">{p.name}</h2>
                    <p className="text-body text-ink-600">
                      {p.county}, {p.region}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/owner/listings/new?propertyId=${p.id}`)} className="!px-3 !py-1.5">
                      Add room
                    </Button>
                    <Link to={`/property/${p.id}`} className="text-primary-600 font-medium text-body self-center">
                      View public page
                    </Link>
                  </div>
                </div>
                {p.rooms.length === 0 ? (
                  <p className="text-body text-warning-600">
                    No rooms yet. Travelers cannot find this property until you add one.
                  </p>
                ) : (
                  <ul>
                    {p.rooms.map((r) => (
                      <RoomRow key={r.id} room={r} />
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </OwnerLayout>
  );
}
