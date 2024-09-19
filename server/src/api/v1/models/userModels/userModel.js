import { DataTypes } from "sequelize";

import { sequelize } from "../../../../config/db.connection.js";

const User = sequelize.define("user", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  }
});
