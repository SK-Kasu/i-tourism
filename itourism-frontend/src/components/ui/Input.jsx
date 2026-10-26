import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-label-sm text-ink-600 uppercase">{label}</label>
      )}
      <input
        ref={ref}
        className="border border-surface-border rounded-control px-3 py-2 text-body
          focus:outline-none focus:ring-2 focus:ring-primary-500"
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
});

export default Input;
