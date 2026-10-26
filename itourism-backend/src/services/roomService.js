const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { monthRange, parseDay, startOfTodayUTC, toDateString } = require("../lib/dates");

// A night belongs to a guest while a booking in one of these states covers it.
const ACTIVE = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"];
const MS_DAY = 86400000;

function cleanRoomInput({ name, pricePerNight, maxOccupancy, amenities }) {
  const n = String(name ?? "").trim();
  if (n.length < 2 || n.length > 80) {
    throw new AppError("Room name must be 2 to 80 characters", 400, "VALIDATION_ERROR");
  }
  const price = Number(pricePerNight);
  if (!Number.isFinite(price) || price < 100 || price > 500000) {
    throw new AppError("Price must be between KES 100 and KES 500,000", 400, "VALIDATION_ERROR");
  }
  const occupancy = Number(maxOccupancy);
  if (!Number.isInteger(occupancy) || occupancy < 1 || occupancy > 20) {
    throw new AppError("Guests must be a whole number from 1 to 20", 400, "VALIDATION_ERROR");
  }
  const list = (Array.isArray(amenities) ? amenities : [])
    .map((a) => String(a).trim())
    .filter(Boolean)
    .slice(0, 20);
  return { name: n, pricePerNight: Math.round(price), maxOccupancy: occupancy, amenities: list };
}

async function loadOwnedRoom(roomId, ownerId) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { property: true } });
  if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");
  if (room.property.ownerId !== ownerId) throw new AppError("Not authorized", 403, "NOT_AUTHORIZED");
  return room;
}

async function addRoom(propertyId, ownerId, input) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw new AppError("Property not found", 404, "NOT_FOUND");
  if (property.ownerId !== ownerId) throw new AppError("Not authorized", 403, "NOT_AUTHORIZED");

  return prisma.room.create({ data: { propertyId, ...cleanRoomInput(input) } });
}

/** Partial update: any field not sent keeps its current value. */
async function updateRoom(roomId, ownerId, input) {
  const room = await loadOwnedRoom(roomId, ownerId);
  const merged = cleanRoomInput({
    name: room.name,
    pricePerNight: room.pricePerNight,
    maxOccupancy: room.maxOccupancy,
    amenities: room.amenities,
    ...input,
  });
  return prisma.room.update({ where: { id: roomId }, data: merged });
}

/** Marks every night that a live booking covers, as dateString -> booking. */
function guestNightMap(bookings) {
  const map = new Map();
  for (const b of bookings) {
    for (let t = b.checkIn.getTime(); t < b.checkOut.getTime(); t += MS_DAY) {
      map.set(toDateString(new Date(t)), b);
    }
  }
  return map;
}

/**
 * Owner opens (blocked=false) or blocks (blocked=true) nights.
 * Nights that a guest has booked or is paying for can never be changed here;
 * the old version could free a paid night and cause a double booking.
 */
async function setBlocked(roomId, ownerId, { dates, blocked }) {
  if (!Array.isArray(dates) || dates.length === 0 || dates.length > 62) {
    throw new AppError("Choose between 1 and 62 dates", 400, "VALIDATION_ERROR");
  }
  if (typeof blocked !== "boolean") {
    throw new AppError("blocked must be true or false", 400, "VALIDATION_ERROR");
  }

  const days = [...new Set(dates)].map(parseDay);
  if (days.some((d) => !d)) throw new AppError("Dates must be in YYYY-MM-DD format", 400, "INVALID_DATES");
  if (days.some((d) => d < startOfTodayUTC())) {
    throw new AppError("Past dates cannot be changed", 400, "INVALID_DATES");
  }
  days.sort((a, b) => a - b);

  await loadOwnedRoom(roomId, ownerId);

  const first = toDateString(days[0]);
  const last = toDateString(days[days.length - 1]);
  const lastDay = days[days.length - 1];

  return prisma.$transaction(async (tx) => {
    await tx.availability.createMany({
      data: days.map((date) => ({ roomId, date })),
      skipDuplicates: true,
    });

    // Same lock the booking flow takes, so a guest booking and this change cannot interleave.
    await tx.$queryRaw`
      SELECT id FROM "Availability"
      WHERE "roomId" = ${roomId}
      AND date >= ${first}::date AND date <= ${last}::date
      FOR UPDATE
    `;

    const live = await tx.booking.findMany({
      where: { roomId, status: { in: ACTIVE }, checkIn: { lte: lastDay }, checkOut: { gt: days[0] } },
    });
    const taken = guestNightMap(live);
    const clash = days.filter((d) => taken.has(toDateString(d)));
    if (clash.length > 0) {
      throw new AppError(
        `${clash.length} of the selected dates already have a guest booking`,
        409,
        "DATES_HAVE_BOOKINGS"
      );
    }

    await tx.availability.updateMany({
      where: { roomId, date: { in: days } },
      data: { isBooked: blocked },
    });
    return { updated: days.length, blocked };
  });
}

/** Owner calendar: every day of the month as open, blocked or booked. */
async function getCalendar(roomId, ownerId, month) {
  const { start, end, days } = monthRange(month);
  await loadOwnedRoom(roomId, ownerId);

  const [rows, bookings] = await Promise.all([
    prisma.availability.findMany({ where: { roomId, date: { gte: start, lt: end }, isBooked: true } }),
    prisma.booking.findMany({
      where: { roomId, status: { in: ACTIVE }, checkIn: { lt: end }, checkOut: { gt: start } },
      include: { traveler: { select: { fullName: true } } },
    }),
  ]);

  const taken = guestNightMap(bookings);
  const blocked = new Set(rows.map((r) => toDateString(r.date)));

  return {
    month,
    days: days.map((d) => {
      const date = toDateString(d);
      const booking = taken.get(date);
      if (booking) {
        const paid = booking.status !== "PENDING_PAYMENT";
        return { date, status: "booked", pending: !paid, guest: paid ? booking.traveler.fullName : null };
      }
      return { date, status: blocked.has(date) ? "blocked" : "open" };
    }),
  };
}

/** Public: which nights of a month are unavailable (booked or blocked). */
async function getAvailability(roomId, month) {
  const { start, end } = monthRange(month);
  return prisma.availability.findMany({
    where: { roomId, date: { gte: start, lt: end }, isBooked: true },
    orderBy: { date: "asc" },
  });
}

async function getRoom(roomId) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { property: { select: { id: true, name: true, county: true, region: true } } },
  });
  if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");
  return room;
}

module.exports = { addRoom, updateRoom, setBlocked, getCalendar, getAvailability, getRoom };
