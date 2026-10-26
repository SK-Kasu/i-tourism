export function formatCurrency(amount) {
  return `KES ${Number(amount).toLocaleString()}`;
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC", // dates are stored as plain days; avoid timezone shifts
  });
}

// Where each role lands after login / registration.
export function homeForRole(role) {
  return role === "OWNER" ? "/owner/dashboard" : "/";
}

export function nightsCount(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkOut <= checkIn) return 0;
  return Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
}
