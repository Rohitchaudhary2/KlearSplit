import { Sequelize } from "sequelize";

import { database, host, password, username } from "./db.config.js";
import logger from "../api/v1/utils/logger.js";

// Creating a new Sequelize instance for connecting to the PostgreSQL database
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect: "postgres",
  logging: false,
});

try {
  await sequelize.authenticate();   // Attempting to authenticate the connection to the database
  console.log('Testing Husky');
  logger.log({
    level: "info", 
    statusCode: 200,
    message: "Connection has been established successfully."
  })
} catch {
  logger.log({
    level: "error",
    statusCode: 503,
    message: 'Service unavailable. Unable to connect to the database.',
  });
}

export default sequelize;
