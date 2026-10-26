import clsx from "clsx";

const STYLES = {
  confirmed: "bg-success-50 text-success-600",
  paid: "bg-success-50 text-success-600",
  available: "bg-success-50 text-success-600",
  pending: "bg-warning-50 text-warning-600",
  cancelled: "bg-danger-50 text-danger-600",
  failed: "bg-danger-50 text-danger-600",
};

export default function Badge({ status, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-pill capitalize",
        STYLES[status] || "bg-surface-muted text-ink-600"
      )}
    >
      {children || status}
    </span>
  );
}
