import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;

// Custom log format to include detailed error information
const customLogFormat = printf(({ level, message, "timestamp": timeStamp }) => {
  const logMessage = `[${timeStamp}] ${level.toUpperCase()} - ${message}`;

  return logMessage;
});

// Created a Winston logger
const logger = createLogger({
  "level": "info",
  "format": combine(
    timestamp({ "format": "YYYY-MM-DD HH:mm:ss" }),
    customLogFormat
  ),
  "transports": [
    new transports.File({ "filename": "src/log/appErrors.log", "level": "error" }),
    new transports.File({ "filename": "src/log/app.log" })
  ]
});

export default logger;
