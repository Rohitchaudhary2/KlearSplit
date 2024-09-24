import logger from "../utils/logger.js";
import morgan from "morgan";

// Format for logging HTTP requests "HTTP method (GET, POST, etc.) Request URL HTTP status code Response time in milliseconds"
const morganFormat = ":method :url :status :response-time ms";

// Logger middleware using morgan
export const loggerMiddleware = morgan(morganFormat, {
  // Stream to which morgan will write log messages
  stream: {
    // Custom write function to process each log message
    write: (message) => {
      const logObject = {
        method: message.split(" ")[0],
        url: message.split(" ")[1],
        status: message.split(" ")[2],
        responseTime: message.split(" ")[3],
      };
      logger.info(JSON.stringify(logObject));
    },
  },
});
