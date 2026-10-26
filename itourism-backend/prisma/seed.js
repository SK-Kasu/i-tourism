/**
 * Demo data so the search page has something to show.
 * Run:  node prisma/seed.js        (safe to re-run; skips existing names)
 * Demo owner login: 0700000001 / Owner1234
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PROPERTIES = [
  { name: "Lakeview Guesthouse", region: "Nyanza", county: "Kisumu", rooms: [["Standard single", 2500, 1], ["Deluxe double", 4200, 2]] },
  { name: "Dunga Beach Lodge", region: "Nyanza", county: "Kisumu", rooms: [["Lake-facing room", 5500, 2], ["Family suite", 8500, 4]] },
  { name: "Kakamega Forest Rest", region: "Western", county: "Kakamega", rooms: [["Cottage", 3800, 2], ["Budget room", 1800, 1]] },
  { name: "Mumias Town Hotel", region: "Western", county: "Kakamega", rooms: [["Business single", 3000, 1], ["Executive double", 4800, 2]] },
  { name: "Kisii Highlands Inn", region: "Nyanza", county: "Kisii", rooms: [["Standard room", 2200, 2], ["Twin room", 3200, 2]] },
];

async function main() {
  const owner = await prisma.user.upsert({
    where: { phoneNumber: "254700000001" },
    update: {},
    create: {
      role: "OWNER",
      fullName: "Demo Owner",
      phoneNumber: "254700000001",
      passwordHash: await bcrypt.hash("Owner1234", 10),
    },
  });

  for (const p of PROPERTIES) {
    const exists = await prisma.property.findFirst({ where: { name: p.name, ownerId: owner.id } });
    if (exists) continue;
    await prisma.property.create({
      data: {
        ownerId: owner.id,
        name: p.name,
        region: p.region,
        county: p.county,
        rooms: {
          create: p.rooms.map(([name, price, maxOccupancy]) => ({
            name,
            pricePerNight: price,
            maxOccupancy,
            amenities: ["WiFi", "Hot water", "Breakfast"],
          })),
        },
      },
    });
    console.log("Created", p.name);
  }
  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
