const Redis = require("ioredis");
const env = require("../config/env");
const logger = require("../config/logger");

const redis = new Redis({
  host: env.redisHost,
  port: env.redisPort,
  lazyConnect: true, // don't fail app boot if Redis isn't up yet in local dev
});

redis.on("error", (err) => logger.error("Redis connection error", { err: err.message }));

module.exports = redis;
