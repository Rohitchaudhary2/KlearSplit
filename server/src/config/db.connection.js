import { Sequelize } from "sequelize";

import { database, host, password, username } from "./db.config.js";

// Creating a new Sequelize instance for connecting to the PostgreSQL database
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect: "postgres",
  logging: false,
});

try {
  await sequelize.authenticate();   // Attempting to authenticate the connection to the database
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
