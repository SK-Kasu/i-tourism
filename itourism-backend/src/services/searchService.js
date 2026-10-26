const prisma = require("../lib/prisma");
const redis = require("../lib/redis");
const logger = require("../config/logger");
const { nightsBetween } = require("../lib/dates");

const CACHE_TTL_SECONDS = 60; // technical documentation Section 4.4.1

/**
 * q: free text matched against county, region and property name.
 * checkIn/checkOut (optional, both required together): only properties with
 * at least one room free for every night of the stay are returned, and only
 * those rooms are included.
 */
async function searchProperties({ q, checkIn, checkOut }) {
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : null;
  const cacheKey = `search:v2:${(q || "all").toLowerCase()}:${checkIn || "-"}:${checkOut || "-"}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.error("Redis read failed, falling back to Postgres", { err: err.message });
  }

  const roomFree = nights
    ? { availability: { none: { date: { in: nights }, isBooked: true } } }
    : {};

  const where = { rooms: { some: roomFree } };
  if (q) {
    where.OR = [
      { county: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const results = await prisma.property.findMany({
    where,
    include: {
      rooms: { where: roomFree },
      photos: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  try {
    await redis.set(cacheKey, JSON.stringify(results), "EX", CACHE_TTL_SECONDS);
  } catch (err) {
    logger.error("Redis write failed", { err: err.message });
  }

  return results;
}

async function getPropertyById(id) {
  return prisma.property.findUnique({
    where: { id },
    include: { rooms: true, photos: true },
  });
}

module.exports = { searchProperties, getPropertyById };
