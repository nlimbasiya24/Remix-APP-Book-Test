import winston from "winston";

// ✅ Define logging format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

// ✅ Create logger instance
export const logger = winston.createLogger({
  level: "info", // Default logging level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(), // Logs to console
    new winston.transports.File({ filename: "logs/app.log" }) // Saves logs to a file
  ],
});

// ✅ Log unhandled errors globally
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
});
