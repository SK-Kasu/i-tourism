require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Fail fast and loudly at boot rather than letting a route crash at request time.
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

module.exports = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: process.env.REDIS_PORT || 6379,
  commissionRate: Number(process.env.COMMISSION_RATE || 0.1),
  daraja: {
    consumerKey: process.env.DARAJA_CONSUMER_KEY,
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
    shortcode: process.env.DARAJA_SHORTCODE,
    passkey: process.env.DARAJA_PASSKEY,
    callbackUrl: process.env.DARAJA_CALLBACK_URL,
  },
  africasTalking: {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
