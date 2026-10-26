import clsx from "clsx";

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx("bg-white rounded-card shadow-card border border-surface-border p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
