import logger from "../utils/logger.js";
export class ErrorHandler extends Error {
  // Constructor to initialize the error with a status code and message
  constructor(statusCode, message) {
    super(message);
    this.message = typeof message === "object" ? JSON.stringify(message.message) : message;
    this.statusCode = statusCode;
    // Capturing the stack trace when the error is created
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Middleware function to handle errors in the Express app
/* eslint-disable-next-line no-unused-vars */
export const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const stackTrace = error.stack || "No stack trace available";

  // Logging error details using the custom logger
  logger.log({
    "level": "error",
    "message": JSON.stringify({
      statusCode,
      "message": error.message,
      "stack": stackTrace
    })
  });

  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  // Sending a JSON response with the status code and message
  return res.status(statusCode).json({
    "success": false,
    message
  });
};
