const cron = require("node-cron");
const logger = require("../config/logger");
const prisma = require("../lib/prisma");
const payoutService = require("../services/payoutService");

/**
 * Runs daily at 08:00 East Africa Time. Finds bookings checked out the
 * previous day with payment held and no payout yet, then triggers the
 * M-Pesa B2C payout. See technical documentation Section 6.2-6.3.
 */
cron.schedule(
  "0 8 * * *",
  async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const eligible = await prisma.booking.findMany({
      where: {
        checkOut: { lte: yesterday },
        status: "CHECKED_OUT",
        payment: { status: "HELD" },
        payout: null,
      },
      include: { room: { include: { property: { include: { owner: true } } } } },
    });

    logger.info(`Payout job: ${eligible.length} booking(s) eligible for payout`);

    for (const booking of eligible) {
      await payoutService.processPayout(booking);
    }
  },
  { timezone: "Africa/Nairobi" }
);
