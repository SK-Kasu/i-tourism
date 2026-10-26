const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const AppError = require("../lib/AppError");
const { normalizePhone } = require("../lib/phone");

// ADMIN accounts are never self-registered; create them directly in the database.
const SELF_SERVE_ROLES = ["TRAVELER", "OWNER"];

async function register({ fullName, phoneNumber, password, role, email }) {
  const phone = normalizePhone(phoneNumber);
  if (!phone) throw new AppError("Enter a valid Kenyan phone number", 400, "INVALID_PHONE");
  if (!fullName || fullName.trim().length < 2) {
    throw new AppError("Full name is required", 400, "INVALID_NAME");
  }
  if (!password || password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
  }
  if (!SELF_SERVE_ROLES.includes(role)) {
    throw new AppError("Invalid account type", 400, "INVALID_ROLE");
  }

  const existing = await prisma.user.findUnique({ where: { phoneNumber: phone } });
  if (existing) throw new AppError("An account with this phone number already exists", 409, "PHONE_TAKEN");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { fullName: fullName.trim(), phoneNumber: phone, email: email || null, passwordHash, role },
  });

  return sanitizeUser(user);
}

async function login({ phoneNumber, password }) {
  const invalid = () => new AppError("Invalid phone number or password", 401, "INVALID_CREDENTIALS");

  const phone = normalizePhone(phoneNumber);
  if (!phone || !password) throw invalid();

  const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
  if (!user) throw invalid();

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw invalid();

  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return { token, user: sanitizeUser(user) };
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { register, login, sanitizeUser };
