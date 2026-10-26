export default function Spinner({ size = 24 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-surface-border border-t-primary-500"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
