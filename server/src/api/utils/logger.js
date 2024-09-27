import { createLogger, format, transports } from "winston";
const { combine, timestamp, json, colorize } = format;

// Created a Winston logger
const logger = createLogger({
  level: "info",
  format: combine(colorize(), timestamp(), json()),
  transports: [
    new transports.File({ filename: "src/log/appErrors.log", level: "error" }),
    new transports.File({ filename: "src/log/app.log" }),
  ],
});

export default logger;
