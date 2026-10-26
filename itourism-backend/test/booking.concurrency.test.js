/**
 * Proves the transactional row-lock in services/bookingService.js actually
 * prevents two simultaneous bookings for the same room and dates.
 * See technical documentation Section 4.4.2 and 7.3; coding roadmap Section 4.6.
 *
 * Requires a running test database — set DATABASE_URL to a disposable
 * Postgres instance before running `npm test`, and seed a test room +
 * two test travelers first (fixtures to be added once auth/property
 * endpoints are stable).
 */
const bookingService = require("../src/services/bookingService");
const prisma = require("../src/lib/prisma");

describe("createBooking — concurrency", () => {
  let roomId, travelerA, travelerB;

  beforeAll(async () => {
    // TODO: replace with real fixtures once a test-seeding script exists.
    // const property = await prisma.property.create({ data: { ... } });
    // const room = await prisma.room.create({ data: { propertyId: property.id, ... } });
    // roomId = room.id;
    // ... create two travelers, seed availability rows for the test date range.
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.skip("allows only one of two simultaneous bookings for the same room/dates", async () => {
    const payload = { roomId, checkIn: "2026-09-01", checkOut: "2026-09-03", totalAmount: 5000 };

    const results = await Promise.allSettled([
      bookingService.createBooking({ ...payload, travelerId: travelerA }),
      bookingService.createBooking({ ...payload, travelerId: travelerB }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.code).toBe("ROOM_UNAVAILABLE");
  });
});
