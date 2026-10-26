const authService = require("../services/authService");
const prisma = require("../lib/prisma");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { token, user } = await authService.login(req.body);
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie("token");
  res.status(204).send();
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json(authService.sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me };
