const AppError = require("./AppError");

const MS_DAY = 86400000;

function parseDay(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfTodayUTC() {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

/**
 * Returns the list of nights (UTC midnight Dates) from checkIn up to, but
 * not including, checkOut. A guest checking out on the 5th does not occupy
 * the night of the 5th, so the next guest can check in that same day.
 */
function nightsBetween(checkIn, checkOut, { allowPast = false, maxNights = 30 } = {}) {
  const start = parseDay(checkIn);
  const end = parseDay(checkOut);
  if (!start || !end) throw new AppError("Dates must be in YYYY-MM-DD format", 400, "INVALID_DATES");
  if (end <= start) throw new AppError("Check-out must be after check-in", 400, "INVALID_DATES");
  if (!allowPast && start < startOfTodayUTC()) {
    throw new AppError("Check-in cannot be in the past", 400, "INVALID_DATES");
  }

  const count = Math.round((end - start) / MS_DAY);
  if (count > maxNights) throw new AppError(`Maximum stay is ${maxNights} nights`, 400, "INVALID_DATES");

  return Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * MS_DAY));
}

/** 'YYYY-MM' -> { start, end (exclusive), days[] } for the whole month, in UTC. */
function monthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || "")) {
    throw new AppError("Month must be in YYYY-MM format", 400, "INVALID_MONTH");
  }
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const count = Math.round((end - start) / MS_DAY);
  const days = Array.from({ length: count }, (_, i) => new Date(start.getTime() + i * MS_DAY));
  return { start, end, days };
}

const toDateString = (d) => d.toISOString().slice(0, 10);

module.exports = { nightsBetween, monthRange, parseDay, startOfTodayUTC, toDateString };
