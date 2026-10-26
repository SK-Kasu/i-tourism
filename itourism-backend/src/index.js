const env = require("./config/env");
const logger = require("./config/logger");
const app = require("./server");
require("./jobs/payoutJob"); // daily payout cron
require("./jobs/expireBookingsJob"); // releases unpaid bookings every 5 minutes

app.listen(env.port, () => {
  logger.info(`API running on port ${env.port}`);
});
