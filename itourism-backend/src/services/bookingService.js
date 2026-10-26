const prisma = require("../lib/prisma");
const AppError = require("../lib/AppError");
const { nightsBetween, toDateString } = require("../lib/dates");

/**
 * Creates a booking inside a transaction that locks the availability rows
 * for every night of the stay, so two travelers cannot book the same room
 * at the same time. See technical documentation Section 4.4.2.
 *
 * Fixes vs. the first scaffold:
 *  - Availability rows are created on demand. Locking only protects rows
 *    that exist, so without this a room with no rows could be double-booked.
 *  - Nights are checkIn..checkOut-1 (checkout day stays free).
 *  - The price is calculated here from the room's rate; any totalAmount
 *    sent by the client is ignored.
 */
async function createBooking({ roomId, travelerId, checkIn, checkOut }) {
  const nights = nightsBetween(checkIn, checkOut);
  const first = toDateString(nights[0]);
  const last = toDateString(nights[nights.length - 1]);

  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError("Room not found", 404, "NOT_FOUND");

    await tx.availability.createMany({
      data: nights.map((date) => ({ roomId, date })),
      skipDuplicates: true,
    });

    const rows = await tx.$queryRaw`
      SELECT id, "isBooked" FROM "Availability"
      WHERE "roomId" = ${roomId}
      AND date >= ${first}::date AND date <= ${last}::date
      FOR UPDATE
    `;
    if (rows.some((r) => r.isBooked)) {
      throw new AppError("This room is no longer available for the selected dates", 409, "ROOM_UNAVAILABLE");
    }

    await tx.availability.updateMany({
      where: { roomId, date: { in: nights } },
      data: { isBooked: true },
    });

    return tx.booking.create({
      data: {
        roomId,
        travelerId,
        checkIn: nights[0],
        checkOut: new Date(nights[nights.length - 1].getTime() + 86400000),
        totalAmount: Number(room.pricePerNight) * nights.length,
        status: "PENDING_PAYMENT",
      },
    });
  });
}

async function getMyBookings(travelerId) {
  return prisma.booking.findMany({
    where: { travelerId },
    include: { room: { include: { property: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getById(id, user) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: { include: { property: true } }, payment: true },
  });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");

  const isTraveler = booking.travelerId === user.id;
  const isOwner = booking.room.property.ownerId === user.id;
  if (!isTraveler && !isOwner && user.role !== "ADMIN") {
    throw new AppError("Not authorized to view this booking", 403, "NOT_AUTHORIZED");
  }
  return booking;
}

async function cancel(id, travelerId) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
  if (booking.travelerId !== travelerId) {
    throw new AppError("Not authorized to cancel this booking", 403, "NOT_AUTHORIZED");
  }
  if (!["PENDING_PAYMENT"].includes(booking.status)) {
    throw new AppError("Paid bookings cannot be cancelled online yet. Please contact support.", 409, "CANNOT_CANCEL");
  }

  // Refund policy / cancellation window: still an open business decision
  // (technical documentation Section 8). Refund logic is added in Sprint 4.
  return prisma.$transaction(async (tx) => {
    await tx.availability.updateMany({
      where: { roomId: booking.roomId, date: { gte: booking.checkIn, lt: booking.checkOut } },
      data: { isBooked: false },
    });
    return tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
  });
}

/** Bookings across all of an owner's properties. Guest phone is shown only once paid. */
async function getOwnerBookings(ownerId) {
  const bookings = await prisma.booking.findMany({
    where: { room: { property: { ownerId } } },
    include: {
      room: { select: { name: true, property: { select: { id: true, name: true } } } },
      traveler: { select: { fullName: true, phoneNumber: true } },
      payment: { select: { status: true, mpesaReceipt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const paid = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];
  return bookings.map((b) => ({
    ...b,
    traveler: { fullName: b.traveler.fullName, phoneNumber: paid.includes(b.status) ? b.traveler.phoneNumber : null },
  }));
}

module.exports = { createBooking, getMyBookings, getOwnerBookings, getById, cancel };
