const { rateLimit } = require("express-rate-limit");
module.exports = rateLimit({
  windowMs: 1 * 60 * 100000,
  limit: 10000,
  message: { message: "Too many requests from this IP" },
});
