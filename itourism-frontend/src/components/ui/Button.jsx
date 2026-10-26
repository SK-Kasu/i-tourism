import clsx from "clsx";

/**
 * variant="primary" is the single accent CTA — use at most once per screen.
 * variant="secondary" / "ghost" for everything else.
 */
export default function Button({ variant = "primary", className, children, ...props }) {
  return (
    <button
      className={clsx(
        "font-medium rounded-control px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "bg-accent-500 hover:bg-accent-600 text-white",
        variant === "secondary" && "border border-surface-border text-ink-600 hover:bg-surface-muted",
        variant === "ghost" && "text-primary-600 hover:bg-primary-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
