const jwt = require("jsonwebtoken");
const createError = require("../middleware/error.js");
const prisma = require("../model/prisma.js");

exports.authenticated = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(createError("Unauthenticated", 401));
    }

    const token = authorization.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY || "mnbvcxz");

    if (!payload.id) {
      return next(createError("Invalid token payload", 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return next(createError("User not found", 404));
    }

    delete user.password;
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return next(createError("Invalid Token", 401));
    }
    next(err);
  }
};
