import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OwnerLayout from "../../components/owner/OwnerLayout.jsx";
import AvailabilityCalendar from "../../components/owner/AvailabilityCalendar.jsx";
import Card from "../../components/ui/Card.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useMyProperties, useRoomCalendar, useSetBlocked } from "../../hooks/useOwner.js";

const currentMonth = () => new Date().toISOString().slice(0, 7);

function addMonths(month, delta) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ManageAvailabilityPage() {
  const [params, setParams] = useSearchParams();
  const { data: properties, isLoading } = useMyProperties();
  const [month, setMonth] = useState(currentMonth());
  const [selected, setSelected] = useState(() => new Set());

  const rooms = useMemo(
    () => (properties || []).flatMap((p) => p.rooms.map((r) => ({ ...r, propertyName: p.name }))),
    [properties]
  );
  const roomId = params.get("roomId") || rooms[0]?.id || "";

  const { data: calendar, isLoading: calLoading, isError } = useRoomCalendar(roomId, month);
  const setBlocked = useSetBlocked(roomId);

  function pickRoom(id) {
    setParams({ roomId: id });
    setSelected(new Set());
  }

  function changeMonth(delta) {
    setMonth((m) => addMonths(m, delta));
    setSelected(new Set());
  }

  function toggle(date) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  function apply(blocked) {
    setBlocked.mutate(
      { dates: [...selected], blocked },
      {
        onSuccess: (res) => {
          toast.success(`${res.updated} night${res.updated === 1 ? "" : "s"} ${blocked ? "blocked" : "opened"}`);
          setSelected(new Set());
        },
      }
    );
  }

  return (
    <OwnerLayout title="Availability">
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size={32} />
        </div>
      )}

      {properties && rooms.length === 0 && (
        <p className="text-body text-ink-600 py-8 text-center">
          Add a room to a property first, then manage its dates here.
        </p>
      )}

      {rooms.length > 0 && (
        <Card className="max-w-2xl">
          <Select label="Room" value={roomId} onChange={(e) => pickRoom(e.target.value)}>
            {properties.map((p) => (
              <optgroup key={p.id} label={p.name}>
                {p.rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </optgroup>
            ))}
          </Select>

          <div className="flex items-center justify-between my-4">
            <Button
              variant="secondary"
              onClick={() => changeMonth(-1)}
              disabled={month <= currentMonth()}
              aria-label="Previous month"
              className="!px-3"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </Button>
            <h2 className="text-heading-md text-ink-900">{monthLabel(month)}</h2>
            <Button variant="secondary" onClick={() => changeMonth(1)} aria-label="Next month" className="!px-3">
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>

          {calLoading && (
            <div className="flex justify-center py-10">
              <Spinner size={28} />
            </div>
          )}
          {isError && <p className="text-danger-500 text-center py-6">Could not load the calendar.</p>}
          {calendar && <AvailabilityCalendar days={calendar.days} selected={selected} onToggle={toggle} />}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-body text-ink-600 mr-auto">
              {selected.size === 0 ? "Tap dates to select them" : `${selected.size} selected`}
            </span>
            <Button variant="secondary" disabled={selected.size === 0 || setBlocked.isPending} onClick={() => apply(false)}>
              Open selected
            </Button>
            <Button disabled={selected.size === 0 || setBlocked.isPending} onClick={() => apply(true)}>
              Block selected
            </Button>
          </div>
          <p className="text-xs text-ink-600 mt-3">
            Blocked nights do not appear in traveler searches. Nights a guest has booked or is paying for cannot be changed.
          </p>
        </Card>
      )}
    </OwnerLayout>
  );
}
