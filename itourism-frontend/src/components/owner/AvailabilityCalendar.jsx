import clsx from "clsx";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * days: [{ date: 'YYYY-MM-DD', status: 'open' | 'blocked' | 'booked', guest, pending }]
 * Past days and nights held by a guest cannot be selected.
 */
export default function AvailabilityCalendar({ days, selected, onToggle }) {
  const today = new Date().toISOString().slice(0, 10);
  // Monday-first column for the 1st of the month.
  const lead = days.length ? (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-400 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((d) => {
          const past = d.date < today;
          const booked = d.status === "booked";
          const isSelected = selected.has(d.date);
          const label = booked ? (d.pending ? "Held" : (d.guest || "Booked").split(" ")[0]) : d.status === "blocked" ? "Blocked" : "";

          return (
            <button
              key={d.date}
              type="button"
              disabled={past || booked}
              aria-pressed={isSelected}
              aria-label={`${d.date} ${booked ? "booked" : d.status}`}
              onClick={() => onToggle(d.date)}
              className={clsx(
                "h-14 rounded-control border text-sm flex flex-col items-center justify-center leading-tight transition-colors",
                d.status === "open" && "bg-white border-surface-border text-ink-900 hover:bg-primary-50",
                d.status === "blocked" && "bg-surface-muted border-surface-border text-ink-400",
                booked && !d.pending && "bg-info-50 border-info-100 text-info-600",
                booked && d.pending && "bg-warning-50 border-warning-50 text-warning-600",
                past && "opacity-40",
                isSelected && "ring-2 ring-primary-500"
              )}
            >
              <span className="font-medium">{Number(d.date.slice(8))}</span>
              {label && <span className="text-[10px] truncate max-w-full px-1">{label}</span>}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink-600">
        <li><span className="inline-block w-3 h-3 rounded-sm border border-surface-border bg-white align-middle mr-1" />Open</li>
        <li><span className="inline-block w-3 h-3 rounded-sm bg-surface-muted border border-surface-border align-middle mr-1" />Blocked by you</li>
        <li><span className="inline-block w-3 h-3 rounded-sm bg-info-50 border border-info-100 align-middle mr-1" />Booked (paid)</li>
        <li><span className="inline-block w-3 h-3 rounded-sm bg-warning-50 border border-warning-500/30 align-middle mr-1" />Held, awaiting payment</li>
      </ul>
    </div>
  );
}
