const { PrismaClient } = require("@prisma/client");

// A single shared instance avoids exhausting Postgres connections,
// which happens quickly if each file creates its own PrismaClient.
const prisma = new PrismaClient();

module.exports = prisma;
