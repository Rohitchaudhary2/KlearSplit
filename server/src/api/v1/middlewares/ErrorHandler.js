import logger from "../utils/logger.js";
export class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    // Error.captureStackTrace(this,this.constructor);
  }
}

/* eslint-disable-next-line no-unused-vars */
export const ErrorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  logger.log({
    level: "error",
    statusCode,
    message: error.message,
  });

  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
