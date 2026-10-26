const cron = require("node-cron");
const prisma = require("../lib/prisma");
const logger = require("../config/logger");

const HOLD_MINUTES = 15;

/**
 * Releases rooms held by bookings that were never paid. Without this, a
 * traveler who abandons the payment screen would block the room forever.
 */
async function expireStaleBookings() {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60 * 1000);
  const stale = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      createdAt: { lt: cutoff },
      OR: [{ payment: { is: null } }, { payment: { is: { status: { in: ["PENDING", "FAILED"] } } } }],
    },
  });

  for (const b of stale) {
    await prisma.$transaction([
      prisma.availability.updateMany({
        where: { roomId: b.roomId, date: { gte: b.checkIn, lt: b.checkOut } },
        data: { isBooked: false },
      }),
      prisma.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" } }),
    ]);
  }
  if (stale.length) logger.info(`Expired ${stale.length} unpaid booking(s)`);
}

cron.schedule("*/5 * * * *", () => {
  expireStaleBookings().catch((err) => logger.error("Expire job failed", { err: err.message }));
});

module.exports = { expireStaleBookings };
