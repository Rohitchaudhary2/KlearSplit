import logger from "../utils/logger.js";
export class ErrorHandler extends Error {
  // Constructor to initialize the error with a status code and message
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Middleware function to handle errors in the Express app
/* eslint-disable-next-line no-unused-vars */
export const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  // Logging error details using the custom logger
  logger.log({
    level: "error",
    message: JSON.stringify({ statusCode, message: error.message }),
  });

  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  // Sending a JSON response with the status code and message
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
